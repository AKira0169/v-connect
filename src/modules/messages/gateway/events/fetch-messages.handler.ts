import { Injectable } from '@nestjs/common';
import { MessagesService } from '../../services/messages.service';
import type { AuthenticatedSocket } from 'src/types/socket-with-user';

@Injectable()
export class FetchMessagesHandler {
  constructor(private readonly messagesService: MessagesService) {}

  async handleFetchMessages(
    socket: AuthenticatedSocket,
    data: { withUserId: string; limit?: number },
  ) {
    const user = socket.user;
    if (!user) return socket.emit('error', 'Unauthorized');

    const messages = await this.messagesService.fetchConversation(
      user.id,
      data.withUserId,
      data.limit ?? 50,
    );

    socket.emit('messages', {
      withUserId: data.withUserId,
      messages,
    });
  }
}
