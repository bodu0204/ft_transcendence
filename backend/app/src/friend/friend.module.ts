import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { OnlineModule } from 'src/online/online.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [OnlineModule, DatabaseModule],
  controllers: [FriendController],
  providers: [FriendService]
})
export class FriendModule {}
