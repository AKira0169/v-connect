import { Injectable } from '@nestjs/common';
import { MessagesService } from '../../services/messages.service';
import type { AuthenticatedSocket } from 'src/types/socket-with-user';
import { Server } from 'socket.io';

@Injectable()
export class ReadMessagesHandler {
  constructor(private readonly messagesService: MessagesService) {}

  async handleMarkAsRead(
    server: Server,
    socket: AuthenticatedSocket,
    data: { withUserId: string },
  ) {
    const user = socket.user;
    if (!user) return;

    // Mark unread messages as READ
    const updated = await this.messagesService.markAsRead(
      data.withUserId,
      user.id,
    );

    // Notify the sender (other user)
    server.to(data.withUserId).emit('messages_read', {
      by: user.id,
      count: updated,
    });
  }
}
