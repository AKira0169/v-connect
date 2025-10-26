import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChatType } from './entities/chat.entity';
import { MessagesService } from '../messages/services/messages.service';
import { Message } from '../messages/entities/message.entity';
import { User } from '../user/entities/user.entity';

export interface ChatPreviewDto {
  id: string;
  participants: User[];
  lastMessage?: Message | null;
  unreadCount: number;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    private readonly messagesService: MessagesService,
  ) {}

  /**
   * Get or create a one-to-one chat between two users
   */
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

  /**
   * Get all chats for a user with latest message and unread count
   */
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

      // exclude yourself
      const otherParticipants = chat.participants.filter(
        (p) => p.id !== user.id,
      );

      chatPreviews.push({
        id: chat.id,
        participants: otherParticipants,
        lastMessage,
        unreadCount,
      });
    }

    return chatPreviews;
  }

  /**
   * Get chat by ID (ensure the user is part of it)
   */
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
}
