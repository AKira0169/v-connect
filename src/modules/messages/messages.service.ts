// src/modules/messages/messages.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus } from './entities/message.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async create(sender: User, receiver: User, content: string) {
    const message = this.messageRepo.create({ sender, receiver, content });
    return this.messageRepo.save(message);
  }

  async markAsDelivered(receiverId: string) {
    await this.messageRepo.update(
      { receiver: { id: receiverId }, status: MessageStatus.SENT },
      { status: MessageStatus.DELIVERED },
    );
  }

  async markAsRead(receiverId: string, senderId: string) {
    await this.messageRepo.update(
      { receiver: { id: receiverId }, sender: { id: senderId } },
      { status: MessageStatus.READ },
    );
  }

  async findConversation(user1Id: string, user2Id: string) {
    return this.messageRepo.find({
      where: [
        { sender: { id: user1Id }, receiver: { id: user2Id } },
        { sender: { id: user2Id }, receiver: { id: user1Id } },
      ],
      order: { createdAt: 'ASC' },
    });
  }
}
