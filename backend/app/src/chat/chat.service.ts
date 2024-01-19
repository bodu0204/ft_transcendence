import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { OnlineService } from 'src/online/online.service';
import { ChatEvent, ChatMessageEvent, Message } from './interface/chat.interface';

@Injectable()
export class ChatService {
	constructor (
		private readonly onlineService:OnlineService,
		private readonly databaseService:DatabaseService
	) {}
	
	async sendDM(sender: number, receiver: number, message: string|undefined) {
		const {id} = await this.databaseService.upsertDmChannel([sender, receiver]);
		const {updatedAt, channelId, ...les} = await this.databaseService.messages.create({
			data: {
				channelId: id,
				userId: sender,
				context: message || ''
			},
		});
		const message_info:ChatMessageEvent = {data_type:'MESSAGE',content:les};
		this.onlineService.sendData(receiver, message_info, `DM/${message_info.content.userId}`);
		return les;
	}

	async getDM(sender:number,receiver:number){
		return await this.databaseService.getDM([sender, receiver]);
	}

	async sendMessage(user_id:number, channel_id:number, message:string|undefined){
		const {updatedAt, channelId, ...message_info} = await this.databaseService.messages.create({
			data: {
				channelId: channel_id,
				userId: user_id,
				context: message || ''
			}
		})
		const data: ChatEvent = {
			data_type: 'MESSAGE',
			content: message_info
		};
		this.onlineService.sendShareData(data, `CHANNEL/${channelId}`);
	}

	async getMessage(channel_id:number){
		const messages = await this.databaseService.messages.findMany({
			where: {
				channelId: channel_id
			}
		})
		const data: Message[] = [];
		messages.forEach(({updatedAt, channelId, ...message_info}) => data.push({...message_info}));
		return data;
	}
}
