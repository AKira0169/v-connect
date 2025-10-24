import { Injectable } from '@nestjs/common';

import type { AuthenticatedSocket } from 'src/types/socket-with-user';
import { Server } from 'socket.io';
import { MessagesService } from '../../services/messages.service';
import { PresenceService } from '../../services/presence.service';

@Injectable()
export class ConnectionHandler {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(server: Server, socket: AuthenticatedSocket) {
    const user = socket.user;
    if (!user) return socket.disconnect();

    this.presenceService.addUser(user.id, socket.id);
    console.log(`🟢 User ${user.id} connected`);

    await this.messagesService.markAsDelivered(user.id);
    server.emit('user_online', { userId: user.id });
  }

  handleDisconnect(server: Server, socket: AuthenticatedSocket) {
    const userId = this.presenceService.removeUserBySocket(socket.id);
    if (userId) {
      server.emit('user_offline', { userId });
      console.log(`🔴 User ${userId} disconnected`);
    }
  }
}
