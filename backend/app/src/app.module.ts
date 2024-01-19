import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { OnlineModule } from './online/online.module';
import { ChatModule } from './chat/chat.module';
import { FriendModule } from './friend/friend.module';
import { ChannelModule } from './channel/channel.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';

@Module({
  imports: [AuthModule, DatabaseModule, OnlineModule, ChatModule, FriendModule, ChannelModule, MailModule, ConfigModule.forRoot(), GameModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
