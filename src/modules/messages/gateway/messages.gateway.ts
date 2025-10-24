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
import { WsJwtGuard } from 'src/guards/ws-jwt.guard';
import type { AuthenticatedSocket } from 'src/types/socket-with-user';
import { ConnectionHandler } from './events/connection.handler';
import { MessageHandler } from './events/message.handler';
import { PresenceHandler } from './events/presence.handler';
import { UseGuards } from '@nestjs/common';
import { FetchMessagesHandler } from './events/fetch-messages.handler';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly connectionHandler: ConnectionHandler,
    private readonly messageHandler: MessageHandler,
    private readonly presenceHandler: PresenceHandler,
    private readonly fetchMessagesHandler: FetchMessagesHandler,
  ) {}

  @UseGuards(WsJwtGuard)
  handleConnection(socket: AuthenticatedSocket) {
    return this.connectionHandler.handleConnection(this.server, socket);
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    return this.connectionHandler.handleDisconnect(this.server, socket);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(@ConnectedSocket() socket: AuthenticatedSocket) {
    return this.presenceHandler.handleGetOnlineUsers(socket);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  handleSendMessage(
    @MessageBody() data: { receiverId: string; content: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    return this.messageHandler.handleSendMessage(this.server, socket, data);
  }
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('fetch_messages')
  handleFetchMessages(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { withUserId: string; limit?: number },
  ) {
    return this.fetchMessagesHandler.handleFetchMessages(socket, data);
  }
}
