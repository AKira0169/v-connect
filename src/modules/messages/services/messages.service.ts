import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus } from '../entities/message.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
  ) {}

  async fetchMessagesByChat(chatId: string, limit = 50) {
    return this.messagesRepo.find({
      where: { chat: { id: chatId } },
      relations: ['sender', 'receiver'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async create(sender: User, receiver: User, content: string, chatId: string) {
    const message = this.messagesRepo.create({
      sender,
      receiver,
      content,
      chat: { id: chatId }, // assign to chat
    });
    return this.messagesRepo.save(message);
  }

  async markAsDelivered(userId: string) {
    await this.messagesRepo
      .createQueryBuilder()
      .update(Message)
      .set({ status: MessageStatus.DELIVERED })
      .where('receiverId = :userId AND status = :status', {
        userId,
        status: MessageStatus.SENT,
      })
      .execute();
  }

  async fetchConversation(userId: string, otherUserId: string, limit = 50) {
    return this.messagesRepo.find({
      where: [
        { sender: { id: userId }, receiver: { id: otherUserId } },
        { sender: { id: otherUserId }, receiver: { id: userId } },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['sender', 'receiver'],
    });
  }

  async markAsRead(senderId: string, receiverId: string) {
    const res = await this.messagesRepo
      .createQueryBuilder()
      .update(Message)
      .set({ status: MessageStatus.READ })
      .where(
        'senderId = :senderId AND receiverId = :receiverId AND status != :status',
        {
          senderId,
          receiverId,
          status: MessageStatus.READ,
        },
      )
      .execute();

    return res.affected || 0;
  }
}
