import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaClient, Users, Status, Channels } from '@prisma/client';
import { GameResult, UserInfoBase, UserInfoBase_noType } from 'src/friend/interface/friend.interface';
import { ChannelOfUser, UserAtChannelBase, UserAuthority } from 'src/channel/interface/channel.interface';
import { Message } from 'src/chat/interface/chat.interface';

@Injectable()
export class DatabaseService extends PrismaClient {
	private pool: Pool;
	constructor(
		private readonly configService: ConfigService) {
		super({
			datasources: {
				db: {
					url: configService.get('DATABASE_URL'),
				},
			},
		});
		this.pool = new Pool({
			host: this.configService.get<string>('DB_HOST'),
			port: 5432,
			database: this.configService.get<string>('POSTGRES_DB'),
			user: this.configService.get<string>('POSTGRES_USER'),
			password: this.configService.get<string>('POSTGRES_PASSWORD'),
			max: 20,
			idleTimeoutMillis: 60000,
		});
	}

	async getUserFromId(user_id:number){
		return await this.users.findUnique({
			where:{
				id:user_id
			}
		});
	}

	async getChannel(channel_id:number):Promise<Channels|undefined>{
		return (await this.pool.query<Channels>(
			//channel_idの行を取得
			`SELECT *
			FROM "Channels"
			WHERE "id"=$1`,
			[channel_id]
		)).rows[0];
	}

//	mmmmmm mmmmm  mmmmm  mmmmmm mm   m mmmm  
//	#      #   "#   #    #      #"m  # #   "m
//	#mmmmm #mmmm"   #    #mmmmm # #m # #    #
//	#      #   "m   #    #      #  # # #    #
//	#      #    " mm#mm  #mmmmm #   ## #mmm" 

	async serchUser(user_name:string, me:number){
		return await this.pool.query<UserInfoBase_noType>(
			`SELECT "id", "name", "nickname", "level", "avatar", "email" 
			FROM "Users"
			WHERE ("name"=$1 OR "nickname"=$2) AND "id"!=$3`,[user_name,user_name,me]);
	}

	async getFriendList(userId:number){
		return await this.pool.query<UserInfoBase>(
			//userIdと相互フォローになっている人から ブロックしている人を除外
			`SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email", 'FRIEND' AS type 
			FROM "FollowList" l INNER JOIN "FollowList" r ON l."followeeId"=r."followerId" and l."followerId"=r."followeeId" INNER JOIN "Users" u ON l."followeeId"= u."id" 
			WHERE l."followerId"=$1 
			EXCEPT
			SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email", 'FRIEND' AS type 
			FROM "BlockedList" b INNER JOIN "Users" u ON b."blockedUserId"= u."id" 
			WHERE b."userId"=$2;`,
			[userId,userId]
		);
	}
	async getFollowingList(userId:number){
		return await this.pool.query<UserInfoBase>(
			//userIdがフォローしている人から　userIdをフォローしている人と　userIdをブロックしている人を除外
			`SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email" , 'FOLLOWING' AS type 
			FROM "FollowList" l INNER JOIN "Users" u ON l."followeeId"= u."id" 
			WHERE l."followerId"=$1 
			EXCEPT 
			SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email" , 'FOLLOWING' AS type 
			FROM "FollowList" l INNER JOIN "Users" u ON l."followerId"= u."id" 
			WHERE l."followeeId"=$2 
			EXCEPT 
			SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email", 'FOLLOWING' AS type 
			FROM "BlockedList" b INNER JOIN "Users" u ON b."blockedUserId"= u."id" 
			WHERE b."userId"=$3;`,
			[userId,userId,userId]
		);
	}
	async getFollowedList(userId:number){
		return await this.pool.query<UserInfoBase>(
			//userIdをフォローしている人から　userIdがフォローしている人と　userIdをブロックしている人を除外
			`SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email" , 'FOLLOWED' AS type 
			FROM "FollowList" l INNER JOIN "Users" u ON l."followerId"= u."id" 
			WHERE l."followeeId"=$1 
			EXCEPT 
			SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email" , 'FOLLOWED' AS type 
			FROM "FollowList" l INNER JOIN "Users" u ON l."followeeId"= u."id" 
			WHERE l."followerId"=$2 
			EXCEPT 
			SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email", 'FOLLOWED' AS type 
			FROM "BlockedList" b INNER JOIN "Users" u ON b."blockedUserId"= u."id" 
			WHERE b."userId"=$3;`,
			[userId,userId,userId]
		);
	}

	async getBlockingList(userId:number){
		return await this.pool.query<UserInfoBase>(
			//userIdをブロックしている人を取得
			`SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email", 'BLOCKING' AS type 
			FROM "BlockedList" b INNER JOIN "Users" u ON b."blockedUserId"= u."id" 
			WHERE b."userId"=$1;`,
			[userId]
		);
	}

//	  mmm  m    m   mm  mmmmmmm
//	m"   " #    #   ##     #   
//	#      #mmmm#  #  #    #   
//	#      #    #  #mm#    #   
//	 "mmm" #    # #    #   #  

	async upsertDmChannel(member:[number, number]){
		const channel = await this.pool.query<{id:number}>(
			//member[0]とmember[1]のDM用のchannelIdを取得
			`SELECT c."id" 
			FROM "Participants" l INNER JOIN "Channels" c ON c."id"=l."channelId" AND c."access"='DIRECT' INNER JOIN "Participants" r ON c."id"=r."channelId" AND l."userId"!=r."userId" 
			WHERE l."userId"=$1 and r."userId"=$2;`,
			[member[0], member[1]]
		);
		switch(channel.rowCount){
			case 0:
				//新たにのDM用のchannelを作成し、二人をchannelのメンバーにする
				const created = await this.channels.create({
					data: {
						ownerId:member[0],
						access:'DIRECT'
					},
				});
				await this.participants.create({
					data: {
						channelId:created.id,
						userId:member[0]
					},
				});
				await this.participants.create({
					data: {
						channelId:created.id,
						userId:member[1]
					},
				});
				return (created);
			case 1:
				return (channel.rows[0]);
			default:
				throw 'database has invalit vale!';
		}
	}

	async getDM(member:[number,number]){
		return (await this.pool.query<Message>(
			//member[0]とmember[1]のDM用のchannelでの会話記録を全部取得
			`SELECT l."id", l."userId", l."createdAt", l."context" 
			FROM "Messages" l INNER JOIN "Channels" c ON c."id"=l."channelId" AND c."access"='DIRECT' INNER JOIN "Participants" r ON c."id"=r."channelId" AND l."userId"!=r."userId" 
			WHERE (l."userId"=$1 and r."userId"=$2) or (l."userId"=$3 and r."userId"=$4) 
			ORDER BY l."createdAt" asc;`,
			[member[0],member[1],member[1],member[0]]
		)).rows;
	}

//	  mmm  m    m   mm   mm   m mm   m mmmmmm m     
//	m"   " #    #   ##   #"m  # #"m  # #      #     
//	#      #mmmm#  #  #  # #m # # #m # #mmmmm #     
//	#      #    #  #mm#  #  # # #  # # #      #     
//	 "mmm" #    # #    # #   ## #   ## #mmmmm #mmmmm

	async searchChannelsAboutUser(userId: number){
		return (await this.pool.query<ChannelOfUser & {ownerId: number}>(
			//userIdがchannelIdにあるものから　Bannされているものを除外
			`SELECT c."id", c."name", c."access", c."ownerId", p."authority"
			FROM "Channels" c INNER JOIN "Participants" p ON c."id"=p."channelId" and c."access"!='DIRECT'
			WHERE p."authority"!='LEFT' and p."userId"=$1
			EXCEPT
			SELECT c."id", c."name", c."access", c."ownerId", p."authority"
			FROM "Channels" c INNER JOIN "Participants" p ON c."id"=p."channelId" and c."access"!='DIRECT' INNER JOIN "BannedList" b ON b."channelId"=p."channelId" and b."userId"=p."userId"
			WHERE p."authority"!='LEFT' and p."userId"=$2;`,
			[userId, userId]
		)).rows.map(({ownerId, ...other}) => {
			if (ownerId === userId)
				other.authority = 'OWNER';
			return other;
		});
	}

	async searchChannelByNameOwner(userId:number ,channel_name:string){
		return await(await this.pool.query<ChannelOfUser>(
			//userIdがOWNERかつchannel_nameのチャンネルリスト　userIdがBANNEDでないchannel_nameのチャンネルリスト　userIdがBANNEDのchannel_nameのチャンネルリストを融合
			`SELECT "id", "name", "access", 'OWNER' AS "authority"
			FROM "Channels"
			WHERE "access"!='DIRECT' and "ownerId"=$1 and "name"=$2 ;`,
			[userId,channel_name]
		)).rows;
	}
	async searchChannelByNameMember(userId:number ,channel_name:string){
		return await(await this.pool.query<ChannelOfUser>(
			//userIdがOWNERかつchannel_nameのチャンネルリスト　userIdがBANNEDでないchannel_nameのチャンネルリスト　userIdがBANNEDのchannel_nameのチャンネルリストを融合
			`SELECT c."id", c."name", c."access", p."authority"
			FROM "Channels" c INNER JOIN "Participants" p ON c."id"=p."channelId"
			WHERE c."access"!='DIRECT' and c."ownerId"!=$1 and p."userId"=$2 and c."name"=$3 
			EXCEPT
			SELECT c."id", c."name", c."access", p."authority"
			FROM "Channels" c INNER JOIN "Participants" p ON c."id"=p."channelId" INNER JOIN "BannedList" b ON b."channelId"=p."channelId" and b."userId"=p."userId"
			WHERE c."access"!='DIRECT' and p."userId"=$4 and c."name"=$5 ;`,
			[userId,userId,channel_name,userId,channel_name]
		)).rows;
	}
	async searchChannelByNameBanned(userId:number ,channel_name:string){
		return await(await this.pool.query<ChannelOfUser>(
			//userIdがOWNERかつchannel_nameのチャンネルリスト　userIdがBANNEDでないchannel_nameのチャンネルリスト　userIdがBANNEDのchannel_nameのチャンネルリストを融合
			`SELECT c."id", c."name", c."access", 'BANNED' AS "authority"
			FROM "Channels" c INNER JOIN "Participants" p ON c."id"=p."channelId" INNER JOIN "BannedList" b ON b."channelId"=p."channelId" and b."userId"=p."userId"
			WHERE c."access"!='DIRECT' and p."userId"=$1 and c."name"=$2 ;`,
			[userId,channel_name]
		)).rows;
	}

	async searchChannelByNameNoInvolvement(userId:number ,channel_name:string){
		return await(await this.pool.query<ChannelOfUser>(
			//channel_nameのチャンネルリストから　Participants　BannedListにあるものを除外
			`SELECT "id", "name", "access", 'LEFT' AS "authority"
			FROM "Channels"
			WHERE "access"!='DIRECT' and "name"=$1
			EXCEPT
			SELECT c."id", c."name", c."access", 'LEFT' AS "authority"
			FROM "Channels" c INNER JOIN "Participants" p ON c."id"=p."channelId"
			WHERE c."access"!='DIRECT' and p."userId"=$2 and c."name"=$3
			EXCEPT
			SELECT c."id", c."name", c."access", 'LEFT' AS "authority"
			FROM "Channels" c INNER JOIN "BannedList" b ON c."id"=b."channelId"
			WHERE c."access"!='DIRECT' and b."userId"=$4 and c."name"=$5;`,
			[channel_name, userId, channel_name, userId, channel_name]
		)).rows;
	}

	async getChannelOwner(channelId:number){
		return (await this.pool.query<UserAtChannelBase>(
			//ownerの情報を取得
			`SELECT u."id",u."name",u."nickname",u."level",u."avatar",u."email", 'OWNER' AS "authority"
			FROM "Users" u INNER JOIN "Channels" c ON u."id"=c."ownerId" AND c."access"!='DIRECT'
			WHERE c."id"=$1 ;`,
			[channelId]
		)).rows;
	}

	async getChannelNolimitUser(channelId:number){
		return (await this.pool.query<UserAtChannelBase>(
			//ownerの以外の取得メンバから　ミュートされている者　バンされてる者を除外
			`SELECT u."id",u."name",u."nickname",u."level",u."avatar",u."email", p."authority"
			FROM "Participants" p INNER JOIN "Users" u ON p."userId"=u."id" INNER JOIN "Channels" c ON p."channelId"=c."id" AND c."access"!='DIRECT'
			WHERE p."userId"!=c."ownerId" AND p."channelId"=$1
			EXCEPT
			SELECT u."id",u."name",u."nickname",u."level",u."avatar",u."email", p."authority"
			FROM "MutedList" m INNER JOIN "Participants" p ON m."userId"=p."userId" AND m."channelId"=p."channelId" INNER JOIN "Users" u ON m."userId"=u."id"
			WHERE m."mutedUntil">NOW() AND m."channelId"=$2
			EXCEPT
			SELECT u."id",u."name",u."nickname",u."level",u."avatar",u."email", p."authority"
			FROM "BannedList" b INNER JOIN "Participants" p ON b."userId"=p."userId" AND b."channelId"=p."channelId" INNER JOIN "Users" u ON b."userId"=u."id"
			WHERE b."channelId"=$3;`,
			[channelId,channelId,channelId]
		)).rows;
	}

	async getChannelMutedUser(channelId:number){
		return (await this.pool.query<UserAtChannelBase>(
			//ミュートされているメンバーから　ブロックされている者を除外
			`SELECT u."id",u."name",u."nickname",u."level",u."avatar",u."email",'MUTED' AS "authority", m."mutedUntil"
			FROM "MutedList" m INNER JOIN "Users" u ON m."userId"=u."id"
			WHERE m."mutedUntil">NOW() AND m."channelId"=$1
			EXCEPT
			SELECT u."id",u."name",u."nickname",u."level",u."avatar",u."email",'MUTED' AS "authority",  m."mutedUntil"
			FROM "BannedList" b INNER JOIN "MutedList" m ON b."userId"=m."userId" AND b."channelId"=m."channelId" INNER JOIN "Users" u ON b."userId"=u."id"
			WHERE b."channelId"=$2 ;`,
			[channelId,channelId]
		)).rows;
	}

	async getChannelBannedUser(channelId:number){
		return (await this.pool.query<UserAtChannelBase>(
			//バンされているユーザを取得
			`SELECT u."id",u."name",u."nickname",u."level",u."avatar",u."email",'BANNED' AS "authority"
			FROM "BannedList" b INNER JOIN "Users" u ON b."userId"=u."id"
			WHERE b."channelId"=$1;`,
			[channelId]
		)).rows;
	}

	async getUserAtChannelBase(userId: number, channelId: number, check_owner: boolean = false, check_muted: boolean = false, check_bann: boolean = true){
		const result = await this.pool.query<UserAtChannelBase>(
			//channelIdでのuserIdの権限とuserIdの情報を取得
			`SELECT u."id", u."name", u."nickname", u."level", u."avatar", u."email", p."authority"
			FROM "Participants" p INNER JOIN "Users" u ON p."userId"=u."id" INNER JOIN "Channels" c ON p."channelId"=c."id" and c."access"!='DIRECT'
			WHERE u."id"=$1 and p."channelId"=$2 ;`,
			[userId, channelId]
		);
		if (result.rowCount === 0)
			return null;
		const user_detail = result.rows[0];
		if (user_detail.authority !== 'ADMINISTRATOR') {
			if (check_bann) {
				const is_banned = await this.pool.query<{authority:UserAuthority}>(
					//userIdがBannされているれば'BANNED'の行が出る
					`SELECT 'BANNED' AS authority
					FROM "BannedList"
					WHERE "userId"=$1 and "channelId"=$2 ;`,
					[userId,channelId]
				);
				if (is_banned.rowCount){
					user_detail.authority = 'BANNED';
					return user_detail;
				}
			}
			if (check_muted && user_detail.authority !== 'LEFT'){
				const is_muted =  await this.pool.query<{mutedUntil:Date}>(
					//userIdがmutedならいつまでかの行が出る
					`SELECT "mutedUntil"
					FROM "MutedList"
					WHERE "userId"=$1 and "channelId"=$2 and "mutedUntil" > NOW()
					ORDER BY "mutedUntil" desc;`,
					[userId,channelId]
				);
				if (is_muted.rowCount){
					user_detail.authority = 'MUTED';	
					user_detail.mutedUntil = is_muted.rows[0].mutedUntil;
					return user_detail;
				}
			}
		}else if (check_owner){
			const is_owner =  await this.pool.query<{authority:UserAuthority}>(
				//userIdがownerなら'OWNER'の行が出る
				`SELECT 'OWNER' AS authority
				FROM "Channels"
				WHERE "ownerId"=$1 and "id"=$2 ;`,
				[userId,channelId]
			);
			if (is_owner.rowCount){
				user_detail.authority = 'OWNER';
				return user_detail;
			}
		}
		return user_detail;
	}

	async getGameResult(user_id: number){
		return (await this.pool.query<GameResult>(
			`SELECT g."id", g."startedAt", r1."score" AS "myScore", r2."score" AS "opponentScore", u."id" AS "opponentId", u."name" AS "opponentName", u."level" AS "opponentLevel", u."email" AS "opponentEmail", u."nickname" AS "opponentNickname", u."avatar" AS "opponentAvatar"
			FROM "Results" r1, "Results" r2, "Games" g, "Users" u
			WHERE r1."gameId"=r2."gameId" AND r1."gameId"=g."id" AND r1."userId"=$1 AND r1."userId"!=r2."userId" AND r2."userId"=u."id"
			ORDER BY g."startedAt" desc;`,
			[user_id]
		)).rows;
	}
}
