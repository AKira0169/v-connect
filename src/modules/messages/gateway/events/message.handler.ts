import { Injectable } from '@nestjs/common';

import { Server } from 'socket.io';
import type { AuthenticatedSocket } from 'src/types/socket-with-user';
import { MessagesService } from '../../services/messages.service';
import { PresenceService } from '../../services/presence.service';
import { ChatService } from 'src/modules/chat/chat.service';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class MessageHandler {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly presenceService: PresenceService,
    private readonly chatService: ChatService,
  ) {}

  async handleSendMessage(
    server: Server,
    socket: AuthenticatedSocket,
    data: { receiverId: string; content: string },
  ) {
    const sender = socket.user;
    if (!sender) return socket.emit('error', 'Unauthorized');

    // ✅ Ensure chat exists and get chat.id
    const chat = await this.chatService.findOrCreateChat(
      sender.id,
      data.receiverId,
    );

    // 2️⃣ Create message
    const message = await this.messagesService.create(
      sender,
      { id: data.receiverId } as User,
      data.content,
      chat.id,
    );

    // 3️⃣ Send to receiver
    const receiverSockets = this.presenceService.getSocketIds(data.receiverId);
    receiverSockets.forEach((socketId) =>
      server.to(socketId).emit('new_message', message),
    );
    // 4️⃣ Send acknowledgment to sender
    const senderSockets = this.presenceService.getSocketIds(sender.id);
    senderSockets.forEach((socketId) =>
      server.to(socketId).emit('message_sent', message),
    );
  }
}
