import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { DatabaseModule } from 'src/database/database.module';
import { GameGateway } from './game.gateway';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from 'src/chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { OnlineModule } from 'src/online/online.module';

@Module({
  imports: [ChatModule, ConfigModule, DatabaseModule, OnlineModule, ScheduleModule.forRoot()],
  providers: [GameService, GameGateway],
  controllers: [GameController]
})
export class GameModule {}
