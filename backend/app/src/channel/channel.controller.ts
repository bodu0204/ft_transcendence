import { BadRequestException, Body, Controller, Delete, Get, HttpCode, MessageEvent, Param, ParseIntPipe, Post, Put, Query, Req, Sse } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { AuthByQuery } from 'src/auth/auth.guard';
import { AuthedReq } from 'src/auth/dto/auth.dto';
import { OnlineService } from 'src/online/online.service';
import { ChannelService } from './channel.service';
import { ChannelAccess, ChannelBaseInfo, ChannelOfUser } from './interface/channel.interface';

@Controller('channel')
export class ChannelController {
	constructor(
		private readonly channelService:ChannelService,
		private onlineService:OnlineService,
	) {}

	@Sse('event')
	@AuthByQuery()
	event(@Req() {socket, user}: AuthedReq): Observable<MessageEvent>{
		const subject = new Subject<MessageEvent>();
		const del_func = this.onlineService.establishConnection(user.sub, 'CHANNEL', subject);
		socket.on('close', del_func);
		return subject;
	}
	
	@Get()
	async getMyChannelList(@Req(){user}:AuthedReq):Promise<ChannelOfUser[]>{
		return await this.channelService.getChannelsAboutMe(user.sub);
	}

	@Put()
	async searchChannelByName(@Req(){user}: AuthedReq, @Body('mame')name: string): Promise<ChannelOfUser[]> {
		return await this.channelService.searchChannelByName(user.sub, name);
	}

	@Post()
	async createChannel(
		@Req(){user}: AuthedReq,
		@Body('mame')name: string | undefined,
		@Body('type')type: ChannelAccess | undefined,
		@Body('password')password: string | undefined
	):Promise<ChannelOfUser>{
		if (!name) {
			throw new BadRequestException();
		}
		switch (type) {
			case 'PROTECTED':
				if (!password)
					throw new BadRequestException();
				return await this.channelService.createChannel(user.sub, name, type, password);
			case 'PUBLIC':
			case 'PRIVATE':
				return await this.channelService.createChannel(user.sub, name, type);
			default:
				throw new BadRequestException();
		}
	}

	@Put('invite/:id')
	@HttpCode(204)
	async inviteUser(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Body('user', ParseIntPipe) target: number
	): Promise<void> {
		const {channel_info} = await this.channelService.checkMemberAuthority(user.sub, channel_id);
		await this.channelService.inviteUserToPrivateChannel(channel_info, target);
	}

	@Put('ban/:id')
	@HttpCode(204)
	async banUser(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Body('user', ParseIntPipe) target: number
	): Promise<void>{
		await this.channelService.checkAdminAuthority(user.sub, channel_id);
		await this.channelService.banUserFromChannel(channel_id, target);
	}

	@Put('unban/:id')
	@HttpCode(204)
	async unbanUser(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Body('user', ParseIntPipe) target: number
	): Promise<void>{
		await this.channelService.checkAdminAuthority(user.sub, channel_id);
		await this.channelService.unbanUserFromChannel(channel_id, target);
	}

	@Put('kick/:id')
	@HttpCode(204)
	async kickUser(
		@Req(){user}:AuthedReq,
		@Param('id', ParseIntPipe)channel_id:number,
		@Body('user', ParseIntPipe) target:number
	): Promise<void>{
		await this.channelService.checkAdminAuthority(user.sub, channel_id);
		await this.channelService.kickUserFromChannel(channel_id, target);
	}

	@Put('mute/:id')
	@HttpCode(204)
	async muteUser(
		@Req(){user}:AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Body('user', ParseIntPipe) target: number,
		@Body('until') until_string: string | undefined
	): Promise<void>{
		if (!until_string)
			throw new BadRequestException();
		const mute_until = new Date(until_string);
		if (mute_until.toString() === 'Invalid Date')
			throw new BadRequestException();
		await this.channelService.checkAdminAuthority(user.sub, channel_id);
		await this.channelService.mute(channel_id, target, mute_until);
	}

	@Put('access/:id')
	@HttpCode(204)
	async changeAccess(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Body('access') access: ChannelAccess,
		@Body('new_password') password: string | undefined
	): Promise<void>{
		if (!access
			|| (access !== 'PRIVATE' && access !== 'PROTECTED' && access !== 'PUBLIC') 
			|| (access === 'PROTECTED' && !password)
		) {
			throw new BadRequestException();
		}
		const {channel_info} = await this.channelService.checkOwnerAuthority(user.sub, channel_id);
		await this.channelService.changeAccess(channel_info, access, password);
	}

	@Put('admin/:id')
	@HttpCode(204)
	async setAdmin(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Body('user', ParseIntPipe) user_id: number
	): Promise<void>{
		const {channel_info} = await this.channelService.checkOwnerAuthority(user.sub, channel_id);
		await this.channelService.setAdmin(channel_info, user_id);
	}

	@Delete('admin/:id')
	@HttpCode(204)
	async delAdmin(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Body('user', ParseIntPipe) user_id: number
	): Promise<void> {
		if (user.sub === user_id)
			throw new BadRequestException();
		const {channel_info} = await this.channelService.checkOwnerAuthority(user.sub, channel_id);
		await this.channelService.delAdmin(channel_info, user_id);
	}

	@Delete(':id')
	@HttpCode(204)
	async leaveChannel(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
	): Promise<void>{
		await this.channelService.leaveChannel(user.sub, channel_id);
	}

	@Get(':id')
	async getBaseInfo(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Query('password') password: string | undefined
	): Promise<ChannelBaseInfo>{
		const {channel_info, user_info, is_incorrect_password} = await this.channelService.checkMemberAuthority(user.sub, channel_id, password, false, false);
		const authority = user_info.authority === 'MUTED' ? 'MEMBER' : user_info.authority;
		if (is_incorrect_password) {
			return {
				channel: this.channelService.parseChannelOfUser(channel_info, authority)
			};
		} else {
			return{
				channel: this.channelService.parseChannelOfUser(channel_info, authority),
				users: await this.channelService.getChannelParticipants(channel_id),
			};
		}
	}
}
