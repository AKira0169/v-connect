// src/modules/messages/messages.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessagesService } from './services/messages.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesGateway } from './gateway/messages.gateway';
import { UserModule } from '../user/user.module';
import { PresenceService } from './services/presence.service';
import { ConnectionHandler } from './gateway/events/connection.handler';
import { MessageHandler } from './gateway/events/message.handler';
import { PresenceHandler } from './gateway/events/presence.handler';
import { FetchMessagesHandler } from './gateway/events/fetch-messages.handler';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
  ],
  providers: [
    MessagesGateway,
    MessagesService,
    PresenceService,
    ConnectionHandler,
    MessageHandler,
    PresenceHandler,
    FetchMessagesHandler,
  ],
  exports: [MessagesGateway, MessagesService],
})
export class MessagesModule {}
