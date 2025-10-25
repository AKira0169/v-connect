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
import type { AuthenticatedSocket } from 'src/types/socket-with-user';
import { ConnectionHandler } from './events/connection.handler';
import { MessageHandler } from './events/message.handler';
import { FetchMessagesHandler } from './events/fetch-messages.handler';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { verifyWsJwt } from 'src/helpers/verify-ws-jwt';
import { FetchConversationsHandler } from './events/fetch_conversations_handler';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly connectionHandler: ConnectionHandler,
    private readonly messageHandler: MessageHandler,
    private readonly fetchMessagesHandler: FetchMessagesHandler,
    private readonly fetchConversationsHandler: FetchConversationsHandler,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket) {
    const allowed = await verifyWsJwt(
      socket,
      this.jwtService,
      this.configService,
      this.userService,
    );
    if (!allowed) return socket.disconnect();
    await this.connectionHandler.handleConnection(this.server, socket);
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    this.connectionHandler.handleDisconnect(this.server, socket);
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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('fetch_conversations')
  handleFetchConversations(@ConnectedSocket() socket: AuthenticatedSocket) {
    return this.fetchConversationsHandler.handleFetchConversations(socket);
  }
}
