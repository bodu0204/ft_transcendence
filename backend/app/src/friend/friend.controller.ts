import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Put, Query, Req, Sse } from '@nestjs/common';
import { FriendService } from './friend.service';
import { AuthedReq } from 'src/auth/dto/auth.dto';
import { AuthByQuery } from 'src/auth/auth.guard';
import { Observable, Subject } from 'rxjs';
import { OnlineService } from 'src/online/online.service';
import { UserInfo, UserInfo_noType } from './interface/friend.interface';

@Controller('friend')
export class FriendController {
	constructor(
		private readonly friendService: FriendService,
		private readonly onlineService: OnlineService
	) {}

	@Get()
	async getMyFriendList(@Req(){user}:AuthedReq): Promise<UserInfo[]>{
		return this.friendService.getFriendList(user.sub);
	}

	@Put('follow')
	async followByEmail(@Req(){user}: AuthedReq, @Body('email')follower: string): Promise<UserInfo_noType>{
		return await this.friendService.followByEmail(user.sub, follower);
	}

	@Get('search')
	async searchUser(@Req(){user}: AuthedReq, @Query('name')name: string): Promise<UserInfo_noType[]>{
		return await this.friendService.searchUser(name,user.sub);
	}

	@Sse('event')
	@AuthByQuery()
	event(@Req() {socket, user}: AuthedReq): Observable<MessageEvent>{
		const subject = new Subject<MessageEvent>();
		const del_func = this.onlineService.establishConnection(user.sub, 'FRIEND', subject);
		socket.on('close', del_func);
		return subject;
	}

	@Get('follow/:id')
	async followById(@Req(){user}: AuthedReq, @Param('id', ParseIntPipe)follower: number): Promise<UserInfo_noType>{
		return await this.friendService.followById(user.sub, follower);
	}

	@Get('block/:id')
	@HttpCode(204)
	async blockById(@Req(){user}: AuthedReq, @Param('id', ParseIntPipe)follower: number): Promise<void>{
		await this.friendService.blockById(user.sub, follower);
	}

	@Get('release/:id')
	async releaseById(@Req(){user}: AuthedReq, @Param('id', ParseIntPipe)follower: number): Promise<UserInfo_noType>{
		return await this.friendService.releaseById(user.sub, follower);
	}

	@Get('result')
	async getGameResult(@Req(){user}: AuthedReq) {
		return await this.friendService.getGameResult(user.sub);
	}

	@Get('winrate')
	async getWinRate(@Req(){user}: AuthedReq) {
		return await this.friendService.getWinRate(user.sub);
	}

	@Get('winrate/:id')
	async getWinRateOther(@Req(){user}: AuthedReq, @Param('id',ParseIntPipe)target:number) {
		return await this.friendService.getWinRate(target);
	}

	@Get(':id')
	async userInfo(@Req(){user}:AuthedReq, @Param('id',ParseIntPipe)target:number): Promise<UserInfo>{
		return await this.friendService.getUserRelation(user.sub,target);
	}
}
