import { Injectable } from '@nestjs/common';
import { PresenceService } from '../../services/presence.service';
import type { AuthenticatedSocket } from 'src/types/socket-with-user';

@Injectable()
export class PresenceHandler {
  constructor(private readonly presenceService: PresenceService) {}

  handleGetOnlineUsers(socket: AuthenticatedSocket) {
    const onlineUserIds = this.presenceService.getOnlineUserIds();
    socket.emit('online_users', onlineUserIds);
  }
}
