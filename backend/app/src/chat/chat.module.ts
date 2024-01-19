import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OnlineModule } from 'src/online/online.module';
import { DatabaseModule } from 'src/database/database.module';
import { ChannelModule } from 'src/channel/channel.module';

@Module({
  imports: [OnlineModule, DatabaseModule, ChannelModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService]
})
export class ChatModule {}
