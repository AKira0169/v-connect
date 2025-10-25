import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { MessagesService } from '../messages/services/messages.service';
import { Message, MessageStatus } from '../messages/entities/message.entity';
import crypto from 'crypto';
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

  /** Find existing 1-on-1 chat or create it */
  async findOrCreateChat(userId1: string, userId2: string): Promise<Chat> {
    const [idA, idB] = [userId1, userId2].sort();
    const key = crypto
      .createHash('sha256')
      .update(`${idA}:${idB}`)
      .digest('hex');

    let chat = await this.chatRepo.findOne({
      where: { key },
      relations: ['participants', 'messages'],
    });

    if (!chat) {
      chat = this.chatRepo.create({
        key,
        participants: [{ id: idA }, { id: idB }],
      });
      await this.chatRepo.save(chat);
    }

    return chat;
  }

  async fetchConversations(userId: string): Promise<ChatPreviewDto[]> {
    const chats = await this.chatRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participant') // full user object
      .leftJoinAndSelect(
        'chat.messages',
        'lastMessage',
        'lastMessage.id = (SELECT m.id FROM message m WHERE m."chatId" = chat.id ORDER BY m."createdAt" DESC LIMIT 1)',
      )
      .where('participant.id = :userId', { userId })
      .orderBy('chat.updatedAt', 'DESC')
      .getMany();

    return chats.map((chat) => {
      const lastMessage = chat.messages?.[0] || null;
      const unreadCount =
        lastMessage &&
        lastMessage.receiver?.id === userId &&
        lastMessage.status !== MessageStatus.READ
          ? 1
          : 0;

      return {
        id: chat.id,
        // exclude the current user but keep full participant objects
        participants: chat.participants.filter((p) => p.id !== userId),
        lastMessage,
        unreadCount,
      };
    });
  }

  /** Fetch messages for a chat */
  async fetchMessagesByChat(
    chatId: string,
    userId?: string,
  ): Promise<Message[]> {
    const messages = await this.messagesService.fetchMessagesByChat(chatId);

    // Mark messages as read for this user
    if (userId) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender) {
        await this.messagesService.markAsRead(lastMsg.sender.id, userId);
      }
    }

    return messages;
  }
}
