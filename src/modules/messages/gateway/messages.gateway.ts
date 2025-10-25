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

import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { verifyWsJwt } from 'src/helpers/verify-ws-jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
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
  }

  handleDisconnect(socket: AuthenticatedSocket) {}

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  handleSendMessage(
    @MessageBody() data: { receiverId: string; content: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    return;
  }
}
