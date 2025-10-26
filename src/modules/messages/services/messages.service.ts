import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Message, MessageStatus } from '../entities/message.entity';
import { Chat } from 'src/modules/chat/entities/chat.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
  ) {}

  async create(data: { chat: Chat; sender: User; content: string }) {
    const message = this.messagesRepo.create({
      chat: data.chat,
      sender: data.sender,
      content: data.content,
    });
    return await this.messagesRepo.save(message);
  }

  // Send message
  async sendMessage(
    chat: Chat,
    sender: User,
    content: string,
  ): Promise<Message> {
    const message = this.messagesRepo.create({
      chat,
      sender,
      content,
      status: MessageStatus.SENT,
    });

    const saved = await this.messagesRepo.save(message);

    // Optionally: update chat's updatedAt so recent chats stay sorted
    chat.updatedAt = new Date();
    await this.messagesRepo.manager.getRepository(Chat).save(chat);

    return saved;
  }

  // Get all messages for a specific chat
  async fetchMessages(chatId: string, limit = 50): Promise<Message[]> {
    return this.messagesRepo.find({
      where: { chat: { id: chatId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // Find last message (used by ChatService)
  async findLastMessage(chatId: string): Promise<Message | null> {
    return this.messagesRepo.findOne({
      where: { chat: { id: chatId } },
      order: { createdAt: 'DESC' },
    });
  }

  // Placeholder for unread messages (future)
  async countUnreadMessages(chatId: string, userId: string): Promise<number> {
    return this.messagesRepo.count({
      where: {
        chat: { id: chatId },
        sender: { id: Not(userId) },
        status: Not(MessageStatus.READ),
      },
    });
  }
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await this.messagesRepo.update(
      {
        chat: { id: chatId },
        sender: { id: Not(userId) },
        status: Not(MessageStatus.READ),
      },
      { status: MessageStatus.READ },
    );
  }
}
