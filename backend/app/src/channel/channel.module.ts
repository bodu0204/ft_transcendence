import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { OnlineModule } from 'src/online/online.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
	imports: [OnlineModule ,DatabaseModule],
	controllers: [ChannelController],
	providers: [ChannelService],
	exports: [ChannelService]
})
export class ChannelModule {}
