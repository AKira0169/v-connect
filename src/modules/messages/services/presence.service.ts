import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  private onlineUsers = new Map<string, string>();

  addUser(userId: string, socketId: string) {
    this.onlineUsers.set(userId, socketId);
  }

  removeUserBySocket(socketId: string): string | undefined {
    const entry = [...this.onlineUsers.entries()].find(
      ([, sid]) => sid === socketId,
    );
    if (!entry) return;
    const [userId] = entry;
    this.onlineUsers.delete(userId);
    return userId;
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  getSocketId(userId: string): string | undefined {
    return this.onlineUsers.get(userId);
  }
}
