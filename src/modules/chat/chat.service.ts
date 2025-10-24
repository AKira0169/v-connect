import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Message, MessageStatus } from '../messages/entities/message.entity';
import { MessagesService } from '../messages/services/messages.service';

export interface ChatPreviewDto {
  id: string;
  participants: any[];
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

  async fetchConversations(userId: string): Promise<ChatPreviewDto[]> {
    // Fetch all chats the user is in
    const chats = await this.chatRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participant')
      .leftJoinAndSelect(
        'chat.messages',
        'lastMessage',
        'lastMessage.id = (SELECT m.id FROM message m WHERE m."chatId" = chat.id ORDER BY m."createdAt" DESC LIMIT 1)',
      )
      .where('participant.id = :userId', { userId })
      .orderBy('chat.updatedAt', 'DESC')
      .getMany();

    // Map chat info
    return chats.map((chat) => {
      const lastMessage = chat.messages?.[0] || null;

      // Compute unread count
      const unreadCount = lastMessage
        ? lastMessage.receiver?.id === userId &&
          lastMessage.status !== MessageStatus.READ
          ? 1
          : 0
        : 0;

      return {
        id: chat.id,
        participants: chat.participants.filter((p) => p.id !== userId),
        lastMessage,
        unreadCount,
      };
    });
  }

  async fetchMessagesByChat(chatId: string, userId?: string) {
    const messages = await this.messagesService.fetchMessagesByChat(chatId);

    // Mark messages as read for this user
    if (userId) {
      const firstMsg = messages.at(-1);
      if (firstMsg && firstMsg.sender) {
        await this.messagesService.markAsRead(firstMsg.sender.id, userId);
      }
    }

    return messages;
  }
}
