import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { $Enums, Authority, Channels, Users } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { ChannelAccess, ChannelEvent, ChannelOfUser, UserAtChannel, UserAtChannelBase, UserAuthority, UserAuthorityBasic } from './interface/channel.interface';
import * as bcrypt from 'bcrypt';
import { OnlineService } from 'src/online/online.service';
import { ChatEvent } from 'src/chat/interface/chat.interface';

@Injectable()
export class ChannelService {
	constructor(
		private onlineService: OnlineService,
		private databaseService: DatabaseService,
	){}

	async getChannelsAboutMe(user_id: number) {
		return await this.databaseService.searchChannelsAboutUser(user_id);
	}

	async searchChannelByName(user_id: number, channel_name: string) {
		return [
			...(await this.databaseService.searchChannelByNameNoInvolvement(user_id, channel_name)),
			...(await this.databaseService.searchChannelByNameOwner(user_id, channel_name)),
			...(await this.databaseService.searchChannelByNameMember(user_id, channel_name)),
			...(await this.databaseService.searchChannelByNameBanned(user_id, channel_name))
		];
	}

	private async addParticipants(user_id: number, channel_id: number, authority: Authority) {
		await this.databaseService.participants.create({
			data: {
				userId: user_id,
				channelId: channel_id,
				authority: authority,
			}
		});
	}

	private async getParticipants(user_id: number, channel_id: number) {
		const result = await this.databaseService.participants.findMany({
			where: {
				userId: user_id,
				channelId: channel_id
			}
		});
		return result;
	}

	private addStatus(data: UserAtChannelBase):UserAtChannel {
		const status = this.onlineService.getStatus(data.id)
		return {
			...data,
			status:status,
		};
	}

	private parseUserAtChannel(user: Users, authority: UserAuthority): UserAtChannel {
		const status = this.onlineService.getStatus(user.id)
		return {
			id: user.id,
			name: user.name,
			nickname: user.nickname || undefined,
			level: user.level,
			avatar: user.avatar,
			email: user.email,
			authority: authority,
			status:status,
		};
	}

	parseChannelOfUser(channnel: Channels, authority: UserAuthorityBasic): ChannelOfUser {
		if (channnel.access === 'DIRECT')
			throw new InternalServerErrorException();
		return {
			id: channnel.id,
			name: channnel.name || '',
			access: channnel.access,
			authority: authority
		};
	}

	async checkOwnerAuthority(user_id:number, channel_id:number) {
		const channel_info = await this.databaseService.channels.findUnique({
			where:{
				id: channel_id,
				ownerId: user_id
			}
		});
		if (!channel_info)
			throw new UnauthorizedException();
		return {channel_info: channel_info};
	}

	async checkAdminAuthority(user_id:number, channel_id:number){
		const user_info = await this.databaseService.getUserAtChannelBase(user_id, channel_id, false, false, false);
		if (!user_info || user_info.authority !== 'ADMINISTRATOR')
			throw new UnauthorizedException();
		return {user_info: user_info};
	}

	async checkMemberAuthority(user_id: number, channel_id: number, password?: string, check_muted: boolean = false, throw_password_error: boolean = true) {
		const channel_info = await this.databaseService.getChannel(channel_id);
		let is_incorrect_password = false;
		if (!channel_info || channel_info.access === 'DIRECT')
			throw new NotFoundException();
		if (
			channel_info.access === 'PROTECTED'
			&& (
				typeof password === undefined
				|| !(typeof channel_info.hashedPassword === 'string' && await bcrypt.compare(password || '', channel_info.hashedPassword))
			)
		) {
			is_incorrect_password = true;
		}
		let user_info_base = await this.databaseService.getUserAtChannelBase(user_id, channel_id, false, check_muted);
		if (!user_info_base || user_info_base.authority === 'LEFT'){
			if (channel_info.access === 'PRIVATE')
				throw new UnauthorizedException();
			if (!user_info_base) {
				await this.addParticipants(user_id, channel_id, 'MEMBER');
			} else {
				await this.databaseService.participants.updateMany({
					data: {
						authority: 'MEMBER',
					},
					where: {
						userId: user_id,
						channelId: channel_id,
					}
				});
			}

			const detailed_user_info = await this.databaseService.getUserFromId(user_id);
			if (!detailed_user_info)
				throw new InternalServerErrorException();
			const user_info:UserAtChannel = this.parseUserAtChannel(detailed_user_info, 'MEMBER');
			const {status, ...buff} = user_info;
			user_info_base = buff;
			const send_data: ChatEvent = {
				data_type: 'USER',
				content: user_info
			}
			this.onlineService.sendShareData(send_data,`CHANNEL/${channel_id}`);
		} else if (user_info_base.authority === 'BANNED')
			throw new UnauthorizedException();
		if (user_info_base.authority === 'ADMINISTRATOR')
			is_incorrect_password = false;
		if (throw_password_error && is_incorrect_password)
			throw new UnauthorizedException();
		if (channel_info.ownerId === user_info_base.id)
			user_info_base.authority = 'OWNER';
		return {channel_info: channel_info, user_info: user_info_base, is_incorrect_password: is_incorrect_password};
	}

	async createChannel(
		user_id: number,
		name: string,
		access: 'PRIVATE' | 'PROTECTED' | 'PUBLIC',
		password?: string
	): Promise<ChannelOfUser> {
		const {createdAt, updatedAt, ownerId, hashedPassword, ...channel} = await this.databaseService.channels.create({
			data:{
				ownerId: user_id,
				name :name,
				access: access,
				hashedPassword: access === 'PROTECTED' ? await bcrypt.hash(password as string, 12) : undefined
			}
		})
		await this.addParticipants(user_id, channel.id, 'ADMINISTRATOR');
		if (typeof channel.name === 'string')
			return {...(channel as {id:number,name:string,access:$Enums.Access}), access:access, authority:'OWNER'};
		else
			return {...channel, access:access, authority:'OWNER', name:''};
	}

	async getChannelParticipants(channel_id:number){
		const user_at_channel:UserAtChannel[] = []
		const base = [
			...await this.databaseService.getChannelOwner(channel_id),
			...await this.databaseService.getChannelNolimitUser(channel_id),
			...await this.databaseService.getChannelMutedUser(channel_id),
			...await this.databaseService.getChannelBannedUser(channel_id),
		];
		base.map(((v:UserAtChannelBase)=>user_at_channel.push({
			...v,
			status: this.onlineService.getStatus(v.id),
		})).bind(this));
		return user_at_channel;
	}

	async inviteUserToPrivateChannel(channel: Channels, target: number) {
		if (channel.access !== 'PRIVATE')
			throw new NotFoundException();
		const target_user = await this.databaseService.getUserFromId(target);
		if (!target_user)
			throw new NotFoundException();
		const target_info = await this.getParticipants(target, channel.id);
		if (!target_info.length) {
			await this.databaseService.participants.create({
				data: {
					userId: target,
					channelId: channel.id,
					authority: 'MEMBER'
				}
			});
		} else if (target_info[0].authority === 'LEFT') {
			await this.databaseService.participants.updateMany({
				data: {
					authority: 'MEMBER'
				},
				where: {
					userId: target,
					channelId: channel.id,
					authority: 'LEFT'
				}
			});
		} else {
			throw new UnauthorizedException()
		}
		const share_data: ChatEvent = {
			data_type: 'USER',
			content: this.parseUserAtChannel(target_user, 'MEMBER')
		}
		this.onlineService.sendShareData(share_data, `CHANNEL/${channel.id}`);
		const channel_data: ChannelEvent = {
			data_type: 'NEW',
			content: this.parseChannelOfUser(channel, 'MEMBER')
		};
		this.onlineService.sendData(target, channel_data, 'CHANNEL');
		return;
	}

	async leaveChannel(user_id: number, channel_id: number) {
		const user = await this.databaseService.getUserAtChannelBase(user_id, channel_id, true);
		if (!user)
			throw new NotFoundException();
		if (user.authority === 'LEFT' || user.authority === 'BANNED')
			return ;
		const channel_data: ChannelEvent = {
			data_type: 'DEL',
			content: {
				id: channel_id,
				authority: 'LEFT'
			}
		};
		if (user.authority === 'OWNER')
		{
			await this.databaseService.channels.delete({
				where: {
					id: channel_id
				}
			});
			const data:ChatEvent = {
				data_type: 'KICK',
				content: {
					message: 'Channel is removed by owner!'
				}
			}
			this.onlineService.sendShareData(data, `CHANNEL/${channel_id}`);
			this.onlineService.removeType(`CHANNEL/${channel_id}`);
			this.onlineService.sendShareData(channel_data,'CHANNEL');
		} else {
			await this.databaseService.participants.updateMany({
				where: {
					channelId: channel_id,
					userId: user_id
				},
				data:{
					authority: 'LEFT'
				}
			});
			user.authority = 'LEFT';
			const user_data:ChatEvent = {
				data_type: 'USER',
				content: this.addStatus(user)
			}
			const kick_data:ChatEvent = {
				data_type: 'KICK',
				content: {
					message: `You left this channel!`
				}
			}
			this.onlineService.sendData(user_id, kick_data, `CHANNEL/${channel_id}`);
			this.onlineService.removeUser(user_id, `CHANNEL/${channel_id}`);
			this.onlineService.sendData(user_id,channel_data,'CHANNEL');
			this.onlineService.sendShareData(user_data, `CHANNEL/${channel_id}`);
		}
	}

	async banUserFromChannel(channel_id:number, user_id:number){
		const user_data = await this.databaseService.getUserAtChannelBase(user_id, channel_id);
		if (!user_data || user_data.authority === 'BANNED')
			throw new NotFoundException();
		if (user_data.authority === 'ADMINISTRATOR')
			throw new UnauthorizedException();
		await this.databaseService.bannedList.create({
			data: {
				userId: user_id,
				channelId: channel_id
			}
		});
		await this.databaseService.participants.updateMany({
			where: {
				userId: user_id,
				channelId: channel_id
			},
			data: {
				authority: 'LEFT'
			}
		});
		const channel_event_data: ChannelEvent = {
			data_type:'DEL',
			content: {
				id: channel_id,
				authority: 'BANNED'
			}
		};
		user_data.authority = 'BANNED';
		const user_event_data: ChatEvent = {
			data_type: 'USER',
			content: this.addStatus(user_data)
		}
		const kick_event_data:ChatEvent={
			data_type: 'KICK',
			content:{
				message:`You are banned!`
			}
		}
		this.onlineService.sendData(user_id, kick_event_data, `CHANNEL/${channel_id}`);
		this.onlineService.removeUser(user_id, `CHANNEL/${channel_id}`);
		this.onlineService.sendData(user_id, channel_event_data, 'CHANNEL');
		this.onlineService.sendShareData(user_event_data, `CHANNEL/${channel_id}`);
	}

	async unbanUserFromChannel(channel_id: number, user_id: number) {
		const ban_info = await this.databaseService.bannedList.findUnique({
			where: {
				ban_relation: {
					userId: user_id,
					channelId: channel_id,
				}
			},
			include: {
				channel: true,
			}
		});
		if (!ban_info)
			throw new NotFoundException();
		if (ban_info.channel.access === 'DIRECT')
			throw new InternalServerErrorException();
		await this.databaseService.bannedList.deleteMany({
			where: {
				userId: user_id,
				channelId: channel_id,
			}
		});
		const user_data = await this.databaseService.getUserAtChannelBase(user_id, channel_id, true, true);
		if (!user_data)
			throw new InternalServerErrorException();
		const channel_data: ChannelEvent = {
			data_type: 'NEW',
			content: this.parseChannelOfUser(ban_info.channel, user_data.authority === 'MUTED' ? 'MEMBER' : user_data.authority)
		};
		const user_event_data: ChatEvent = {
			data_type: 'USER',
			content: this.addStatus(user_data)
		}
		this.onlineService.sendData(user_id, channel_data, 'CHANNEL');
		this.onlineService.sendShareData(user_event_data, `CHANNEL/${channel_id}`);
	}

	async kickUserFromChannel(channel_id: number, user_id: number) {
		const user_data = await this.databaseService.getUserAtChannelBase(user_id, channel_id);
		if (!user_data || user_data.authority === 'LEFT')
			throw new NotFoundException();
		if (user_data.authority === 'ADMINISTRATOR')
			throw new UnauthorizedException();
		await this.databaseService.participants.update({
			where: {
				participant_relation: {
					userId: user_id,
					channelId: channel_id
				},
			},
			data: {
				authority: 'LEFT'
			}
		});
		const channel_data: ChannelEvent = {
			data_type: 'DEL',
			content: {
				id: channel_id,
				authority: 'LEFT'
			}
		};
		user_data.authority = 'LEFT';
		const data: ChatEvent = {
			data_type: 'USER',
			content: this.addStatus(user_data)
		}
		const kick_data: ChatEvent = {
			data_type: 'KICK',
			content: {
				message: `You are kicked!`
			}
		}
		this.onlineService.sendData(user_id, kick_data, `CHANNEL/${channel_id}`);
		this.onlineService.removeUser(user_id, `CHANNEL/${channel_id}`);
		this.onlineService.sendData(user_id,channel_data, 'CHANNEL');
		this.onlineService.sendShareData(data, `CHANNEL/${channel_id}`);
	}

	async mute(channel_id:number, user_id:number, until:Date){
		const user_data = await this.databaseService.getUserAtChannelBase(user_id, channel_id, false, true);
		if (!user_data)
			throw new NotFoundException();
		if ( user_data.authority === 'ADMINISTRATOR')
			throw new UnauthorizedException();
		const mute_data = await this.databaseService.mutedList.findMany({
			where:{
				userId:user_id,
				channelId:channel_id,
			}
		})
		if (mute_data.length){
			await this.databaseService.mutedList.update({
				where: {
					mute_relation: {
						userId: user_id,
						channelId: channel_id,
					}
				},
				data: {
					mutedUntil: until
				},
			});
		}else{
			await this.databaseService.mutedList.create({
				data: {
					userId: user_id,
					channelId: channel_id,
					mutedUntil: until
				}
			});
		}
		user_data.authority = 'MUTED';
		const data: ChatEvent = {
			data_type: 'USER',
			content: {
				...user_data,
				mutedUntil: until,
				status: this.onlineService.getStatus(user_data.id)
			}
		}
		this.onlineService.sendShareData(data, `CHANNEL/${channel_id}`);
	}

	async changeAccess(channel_info: Channels, access: ChannelAccess, password: string | undefined){
		if (channel_info.access === access && (access === 'PRIVATE' || access === 'PUBLIC'))
			return ;
		await this.databaseService.channels.update({
			where:{
				id:channel_info.id
			},
			data: {
				access: access,
				hashedPassword: (access === 'PROTECTED') ? (await bcrypt.hash(password as string, 12)) : (undefined)
			}
		});
		const channel_data: ChannelEvent = {
			data_type: 'ACCESS',
			content: {
				id: channel_info.id,
				access: access
			}
		};
		this.onlineService.sendShareData(channel_data, `CHANNEL`);
		const data: ChatEvent = {
			data_type: 'KICK',
			content: {
				message: 'Channel access was changeed by owner!'
			}
		};
		this.onlineService.sendShareData(data, `CHANNEL/${channel_info.id}`);
		this.onlineService.removeType(`CHANNEL/${channel_info.id}`);
	}

	async setAdmin(channel_info:Channels, user_id:number){
		const user_data = await this.databaseService.getUserAtChannelBase(user_id, channel_info.id);
		if (!user_data)
			throw new NotFoundException();
		if (user_data.authority === 'ADMINISTRATOR')
			return ;
		await this.databaseService.bannedList.deleteMany({
			where: {
				userId: user_id,
				channelId: channel_info.id
			}
		});
		await this.databaseService.mutedList.deleteMany({
			where: {
				userId: user_id,
				channelId: channel_info.id
			}
		});
		await this.databaseService.participants.update({
			data: {
				authority: 'ADMINISTRATOR'
			},
			where: {
				participant_relation: {
					userId: user_id,
					channelId: channel_info.id
				}
			}
		});
		const channel_data:ChannelEvent={
			data_type:'NEW',
			content:this.parseChannelOfUser(channel_info, 'ADMINISTRATOR')
		}
		this.onlineService.sendData(user_id, channel_data, `CHANNEL`);
		user_data.authority = 'ADMINISTRATOR';
		const data: ChatEvent = {
			data_type: 'USER',
			content: this.addStatus(user_data)
		}
		this.onlineService.sendShareData(data, `CHANNEL/${channel_info.id}`);
	}

	async delAdmin(channel_info:Channels, user_id:number){
		const user_data = await this.databaseService.getUserAtChannelBase(user_id, channel_info.id);
		if (!user_data)
			throw new NotFoundException();
		if (user_data.authority !== 'ADMINISTRATOR')
			return ;
		await this.databaseService.participants.updateMany({
			data: {
				authority: 'MEMBER'
			},
			where:{
				userId: user_id,
				channelId: channel_info.id
			}
		});
		const channel_data: ChannelEvent = {
			data_type: 'NEW',
			content: this.parseChannelOfUser(channel_info, 'MEMBER')
		};
		this.onlineService.sendData(user_id, channel_data, `CHANNEL`);
		user_data.authority = 'MEMBER';
		const data: ChatEvent = {
			data_type: 'USER',
			content: this.addStatus(user_data)
		}
		const kick_data: ChatEvent = {
			data_type: 'KICK',
			content: {
				message: 'Administrative privileges have been revoked!'
			}
		};
		this.onlineService.sendShareData(data, `CHANNEL/${channel_info.id}`);
		this.onlineService.sendData(user_id, kick_data, `CHANNEL/${channel_info.id}`);
		this.onlineService.removeUser(user_id, `CHANNEL/${channel_info.id}`);
	}
}
