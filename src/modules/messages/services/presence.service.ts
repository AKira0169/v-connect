import { Injectable } from '@nestjs/common';

type OnlineUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  socketIds: Set<string>; // can have multiple connections
};

@Injectable()
export class PresenceService {
  private onlineUsers = new Map<string, OnlineUser>();

  addUser(
    user: { id: string; email: string; firstName: string; lastName: string },
    socketId: string,
  ) {
    const existing = this.onlineUsers.get(user.id);
    if (existing) {
      existing.socketIds.add(socketId);
    } else {
      this.onlineUsers.set(user.id, {
        _id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        socketIds: new Set([socketId]),
      });
    }
  }

  removeUserBySocket(socketId: string): string | undefined {
    for (const [userId, user] of this.onlineUsers.entries()) {
      if (user.socketIds.has(socketId)) {
        user.socketIds.delete(socketId);
        if (user.socketIds.size === 0) this.onlineUsers.delete(userId);
        return userId;
      }
    }
    return undefined;
  }

  getOnlineUsers(): Omit<OnlineUser, 'socketIds'>[] {
    return Array.from(this.onlineUsers.values()).map(
      ({ socketIds, ...rest }) => rest,
    );
  }

  getSocketIds(userId: string): string[] {
    return Array.from(this.onlineUsers.get(userId)?.socketIds || []);
  }
}
