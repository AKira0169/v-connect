import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChatType } from './entities/chat.entity';
import { MessagesService } from '../messages/services/messages.service';
import { Message } from '../messages/entities/message.entity';
import { User } from '../user/entities/user.entity';
import { AiService } from './ai.service';

export interface ChatPreviewDto {
  id: string;
  participants: User[];
  lastMessage?: Message | null;
  aiInsights?: {
    summary: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    keywords: string[];
  };
  unreadCount: number;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    private readonly messagesService: MessagesService,
    private readonly aiService: AiService,
  ) {}

  async getOrCreateDirectChat(userA: User, userB: User): Promise<Chat> {
    const chats = await this.chatRepo.find({
      where: { type: ChatType.DIRECT },
      relations: ['participants'],
    });

    const existingChat = chats.find(
      (chat) =>
        chat.participants.length === 2 &&
        chat.participants.some((u) => u.id === userA.id) &&
        chat.participants.some((u) => u.id === userB.id),
    );

    if (existingChat) return existingChat;

    const newChat = this.chatRepo.create({
      type: ChatType.DIRECT,
      participants: [userA, userB],
    });

    return await this.chatRepo.save(newChat);
  }

  async findUserChats(user: User): Promise<ChatPreviewDto[]> {
    const chats = await this.chatRepo
      .createQueryBuilder('chat')
      .innerJoin('chat.participants', 'participant')
      .leftJoinAndSelect('chat.participants', 'participants')
      .where('participant.id = :userId', { userId: user.id })
      .orderBy('chat.updatedAt', 'DESC')
      .getMany();

    const chatPreviews: ChatPreviewDto[] = [];

    for (const chat of chats) {
      const lastMessage = await this.messagesService.findLastMessage(chat.id);
      const unreadCount = await this.messagesService.countUnreadMessages(
        chat.id,
        user.id,
      );

      const otherParticipants = chat.participants.filter(
        (p) => p.id !== user.id,
      );

      // ✅ Normalize AI insights
      const normalizedInsights = chat.aiInsights
        ? {
            summary: chat.aiInsights.summary || 'No summary available',
            sentiment:
              chat.aiInsights.sentiment === 'positive' ||
              chat.aiInsights.sentiment === 'negative' ||
              chat.aiInsights.sentiment === 'neutral'
                ? chat.aiInsights.sentiment
                : 'neutral',
            keywords: chat.aiInsights.keywords || [],
          }
        : undefined;

      chatPreviews.push({
        id: chat.id,
        participants: otherParticipants,
        lastMessage,
        aiInsights: normalizedInsights,
        unreadCount,
      });
    }

    return chatPreviews;
  }

  async findChatById(chatId: string, user: User): Promise<Chat> {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ['participants'],
    });

    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.participants.some((u) => u.id === user.id))
      throw new NotFoundException('You are not a participant in this chat');

    return chat;
  }

  async generateInsights(chatId: string, user: User) {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ['participants', 'messages', 'messages.sender'],
    });

    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.participants.some((u) => u.id === user.id))
      throw new NotFoundException('You are not a participant in this chat');

    // 🧠 Generate insights using all messages
    const aiInsights = await this.aiService.generateChatInsights(chat.messages);

    // 💾 Ensure all fields exist
    chat.aiInsights = {
      summary: aiInsights.summary || 'No summary available',
      sentiment:
        aiInsights.sentiment === 'positive' ||
        aiInsights.sentiment === 'negative' ||
        aiInsights.sentiment === 'neutral'
          ? aiInsights.sentiment
          : 'neutral',
      keywords: aiInsights.keywords || [],
    };

    await this.chatRepo.save(chat);

    return chat.aiInsights;
  }
}
