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

    // Add user to presence
    this.presenceService.addUser(user, socket.id);
    console.log(`🟢 User ${user.id} connected`);

    // Mark messages as delivered
    await this.messagesService.markAsDelivered(user.id);

    // Broadcast updated online users to all clients
    server.emit('online_users', this.presenceService.getOnlineUsers());
  }

  handleDisconnect(server: Server, socket: AuthenticatedSocket) {
    const userId = this.presenceService.removeUserBySocket(socket.id);
    if (userId) {
      console.log(`🔴 User ${userId} disconnected`);
      // Broadcast updated online users
      server.emit('online_users', this.presenceService.getOnlineUsers());
    }
  }
}
