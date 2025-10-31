import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UserParam } from 'src/Decorator/user-param.decorator';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('direct/:userId')
  async startDirectChat(
    @UserParam() user: User,
    @Param('userId') userId: string,
  ) {
    const otherUser = await this.userService.findById(userId);
    const chat = await this.chatService.getOrCreateDirectChat(user, otherUser);
    return chat;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserChats(@UserParam() user: User) {
    return this.chatService.findUserChats(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/insights')
  async getChatInsights(@Param('id') chatId: string, @UserParam() user: User) {
    return await this.chatService.generateInsights(chatId, user);
  }
}
