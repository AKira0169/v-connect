import { Injectable } from '@nestjs/common';
import { ChatService } from 'src/modules/chat/chat.service';
import type { AuthenticatedSocket } from 'src/types/socket-with-user';

@Injectable()
export class FetchConversationsHandler {
  constructor(private readonly chatService: ChatService) {}

  async handleFetchConversations(socket: AuthenticatedSocket) {
    try {
      const userId = socket.user.id;
      const conversations = await this.chatService.fetchConversations(userId);

      socket.emit('conversations', conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      socket.emit('error', { message: 'Failed to fetch conversations' });
    }
  }
}
