import { BadRequestException, Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, Req, Sse, UnauthorizedException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthedReq } from 'src/auth/dto/auth.dto';
import { AuthByQuery } from 'src/auth/auth.guard';
import { Observable, Subject } from 'rxjs';
import { OnlineService } from 'src/online/online.service';
import { ChannelService } from 'src/channel/channel.service';
import { Message } from './interface/chat.interface';

@Controller('chat')
export class ChatController {
	constructor(
		private chatService:ChatService,
		private onlineService:OnlineService,
		private channelService:ChannelService
	){}

	@Sse('dm/event/:id')
	@AuthByQuery()
	dmEvent(@Req() {socket, user}: AuthedReq, @Param('id', ParseIntPipe)receiver: number): Observable<MessageEvent> {
		const subject = new Subject<MessageEvent>();
		const del_func = this.onlineService.establishConnection(user.sub, `DM/${receiver}`, subject);
		socket.on('close', del_func);
		return subject;
	}

	@Post('dm/:id')
	async sendDM(@Req(){user}: AuthedReq, @Param('id', ParseIntPipe)receiver: number, @Body('message')message: string):Promise<Message> {
		if (user.sub === receiver)
			throw new BadRequestException();
		return (await this.chatService.sendDM(user.sub, receiver, message));
	}

	@Get('dm/:id')
	async getDM(@Req(){user}: AuthedReq, @Param('id', ParseIntPipe)sender: number) {
		if (sender === user.sub)
			throw new BadRequestException();
		return await this.chatService.getDM(sender, user.sub);
	}

	@Sse('channel/event/:id')
	@AuthByQuery()
	async channelEvent(
		@Req() {socket, user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id:number,
		@Query('password') password:string | undefined,
	): Promise<Observable<MessageEvent>> {
		await this.channelService.checkMemberAuthority(user.sub, channel_id, password);
		const subject = new Subject<MessageEvent>();
		const del_func = this.onlineService.establishConnection(user.sub, `CHANNEL/${channel_id}`, subject);
		socket.on('close', del_func);
		return subject;
	}

	@Post('channel/:id')
	@HttpCode(204)
	async sendMessage(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Body('message')message: string,
		@Query('password') password:string | undefined,
	) {
		const {user_info} = await this.channelService.checkMemberAuthority(user.sub, channel_id, password, true);
		if (user_info.authority === 'MUTED')
			throw new UnauthorizedException();
		await this.chatService.sendMessage(user.sub, channel_id, message);
		return ;
	}

	@Get('channel/:id')
	async getMessage(
		@Req(){user}: AuthedReq,
		@Param('id', ParseIntPipe)channel_id: number,
		@Query('password') password:string | undefined,
	):Promise<Message[]> {
		await this.channelService.checkMemberAuthority(user.sub,channel_id,password);
		return await this.chatService.getMessage(channel_id);
	}

}
