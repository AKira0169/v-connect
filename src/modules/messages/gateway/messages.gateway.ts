import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { ChatService } from 'src/modules/chat/chat.service';
import { MessagesService } from '../services/messages.service';
import { WsJwtGuard } from 'src/guards/ws-jwt.guard';
import { verifyWsJwt } from 'src/helpers/verify-ws-jwt';
import type { AuthenticatedSocket } from 'src/types/socket-with-user';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  // 🟢 Map of userId -> socketIds[]
  private onlineUsers: Map<string, string[]> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly messagesService: MessagesService,
  ) {}

  // ✅ On client connection
  async handleConnection(socket: AuthenticatedSocket) {
    const allowed = await verifyWsJwt(
      socket,
      this.jwtService,
      this.configService,
      this.userService,
    );

    if (!allowed) {
      socket.disconnect();
      return;
    }

    const userId = socket.user.id;
    const sockets = this.onlineUsers.get(userId) || [];
    sockets.push(socket.id);
    this.onlineUsers.set(userId, sockets);

    // Notify clients only if this is the first socket for this user
    if (sockets.length === 1) {
      this.server.emit('user_online', { userId });
    }

    this.logger.log(`🟢 User connected: ${userId} (${socket.id})`);
  }

  // 🔴 On client disconnect
  handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.user?.id;
    if (!userId) return;

    const sockets = this.onlineUsers.get(userId) || [];
    const remaining = sockets.filter((id) => id !== socket.id);

    if (remaining.length > 0) {
      this.onlineUsers.set(userId, remaining);
    } else {
      this.onlineUsers.delete(userId);
      this.server.emit('user_offline', { userId });
    }

    this.logger.log(`🔴 User disconnected: ${userId} (${socket.id})`);
  }

  // 📨 Send a new message
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { receiverId: string; content: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const sender = socket.user;
    const { receiverId, content } = data;

    // 1️⃣ Ensure chat exists or create a new one
    const receiver = await this.userService.findById(receiverId);
    const chat = await this.chatService.getOrCreateDirectChat(sender, receiver);

    // 2️⃣ Save message in DB
    const message = await this.messagesService.create({
      chat,
      sender,
      content,
    });

    // 3️⃣ Emit to both users in this chat room
    this.server.to(chat.id).emit('new_message', message);

    // 4️⃣ Send directly to receiver sockets if online
    const receiverSockets = this.onlineUsers.get(receiverId);
    if (receiverSockets) {
      receiverSockets.forEach((sid) => {
        this.server.to(sid).emit('new_message', message);
      });
    }

    // 5️⃣ Confirm delivery to sender
    socket.emit('message_sent', message);
  }

  // ✅ Mark all messages in a chat as read
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const user = socket.user;
    const { chatId } = data;

    await this.messagesService.markMessagesAsRead(chatId, user.id);

    this.server.to(chatId).emit('messages_read', {
      chatId,
      userId: user.id,
    });
  }

  // ✅ Join a chat room
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const { chatId } = data;
    await socket.join(chatId);
    this.logger.log(`📥 ${socket.user.id} joined chat ${chatId}`);
    socket.emit('joined_chat', { chatId });
  }

  // ✅ Get all currently online users
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(@ConnectedSocket() socket: AuthenticatedSocket) {
    const online = Array.from(this.onlineUsers.keys());
    socket.emit('online_users', online);
  }
}
