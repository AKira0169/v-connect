import { Injectable } from '@nestjs/common';

import { Server } from 'socket.io';
import type { AuthenticatedSocket } from 'src/types/socket-with-user';
import { User } from 'src/modules/user/entities/user.entity';
import { MessagesService } from '../../services/messages.service';
import { PresenceService } from '../../services/presence.service';

@Injectable()
export class MessageHandler {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly presenceService: PresenceService,
  ) {}

  async handleSendMessage(
    server: Server,
    socket: AuthenticatedSocket,
    data: { receiverId: string; content: string },
  ) {
    const user = socket.user;
    if (!user) return socket.emit('error', 'Unauthorized');

    const message = await this.messagesService.create(
      user,
      { id: data.receiverId } as User,
      data.content,
    );
    const receiverSocket = this.presenceService.getSocketId(data.receiverId);
    if (receiverSocket) {
      server.to(receiverSocket).emit('new_message', message);
      await this.messagesService.markAsDelivered(data.receiverId);
    }
    socket.emit('message_sent', message);
  }
}
