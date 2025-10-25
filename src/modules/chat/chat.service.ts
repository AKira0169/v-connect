import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
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
}
