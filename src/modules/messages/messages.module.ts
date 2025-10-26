// src/modules/messages/messages.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessagesService } from './services/messages.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesGateway } from './gateway/messages.gateway';
import { UserModule } from '../user/user.module';

import { ChatModule } from '../chat/chat.module';
import { MessagesController } from './messages.controller';

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
    forwardRef(() => ChatModule),
  ],
  controllers: [MessagesController],
  providers: [MessagesGateway, MessagesService],
  exports: [MessagesGateway, MessagesService],
})
export class MessagesModule {}
