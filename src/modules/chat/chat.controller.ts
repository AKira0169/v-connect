import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { UserParam } from 'src/Decorator/user-param.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getChats(@UserParam() user: User) {
    return this.chatService.fetchConversations(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':chatId/messages')
  async getChatMessages(
    @Param('chatId') chatId: string,
    @UserParam() user: User,
  ) {
    return this.chatService.fetchMessagesByChat(chatId, user.id);
  }
}
