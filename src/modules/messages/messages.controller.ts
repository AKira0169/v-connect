import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UserParam } from 'src/Decorator/user-param.decorator';
import { User } from '../user/entities/user.entity';
import { MessagesService } from './services/messages.service';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly chatService: ChatService,
  ) {}

  // 💬 Send a new message in a chat
  @UseGuards(JwtAuthGuard)
  @Post(':chatId')
  async sendMessage(
    @UserParam() user: User,
    @Param('chatId') chatId: string,
    @Body('content') content: string,
  ) {
    const chat = await this.chatService.findChatById(chatId, user);
    const message = await this.messagesService.sendMessage(chat, user, content);
    return message;
  }

  // 📜 Get chat messages
  @UseGuards(JwtAuthGuard)
  @Get(':chatId')
  async getMessages(@UserParam() user: User, @Param('chatId') chatId: string) {
    await this.chatService.findChatById(chatId, user); // ensures access
    const messages = await this.messagesService.fetchMessages(chatId);
    return messages;
  }
}
