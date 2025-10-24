import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { User } from 'src/modules/user/entities/user.entity';
import { MessagesService } from './messages.service';
import { WsJwtGuard } from 'src/guards/ws-jwt.guard';
import type { AuthenticatedSocket } from 'src/types/socket-with-user';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>();

  constructor(private readonly messagesService: MessagesService) {}
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(@ConnectedSocket() socket: AuthenticatedSocket) {
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    socket.emit('online_users', onlineUserIds);
  }
  @UseGuards(WsJwtGuard)
  async handleConnection(@ConnectedSocket() socket: AuthenticatedSocket) {
    const user = socket.user;
    if (!user) {
      return socket.disconnect();
    }
    this.onlineUsers.set(user.id, socket.id);
    console.log(`🟢 User ${user.id} connected`);

    await this.messagesService.markAsDelivered(user.id);
    this.server.emit('user_online', { userId: user.id });
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    const userId = [...this.onlineUsers.entries()].find(
      ([, sid]) => sid === socket.id,
    )?.[0];

    if (userId) {
      this.onlineUsers.delete(userId);
      this.server.emit('user_offline', { userId });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { receiverId: string; content: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const user = socket.user;

    if (!user) {
      console.warn('❌ Unauthorized message attempt');
      return socket.emit('error', 'Unauthorized');
    }

    const message = await this.messagesService.create(
      user,
      { id: data.receiverId } as User,
      data.content,
    );

    const receiverSocket = this.onlineUsers.get(data.receiverId);

    if (receiverSocket) {
      this.server.to(receiverSocket).emit('new_message', message);
      await this.messagesService.markAsDelivered(data.receiverId);
      console.log(`📨 Message delivered to user ${data.receiverId}`);
    } else {
      console.log(`📦 User ${data.receiverId} offline — message saved`);
    }

    socket.emit('message_sent', message);
  }
}
