import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { OnlineService } from 'src/online/online.service';
import { FollowEvent, Reration, UserInfo, UserInfoBase, UserInfoBase_noType, UserInfo_noType } from './interface/friend.interface';
import { Users } from '@prisma/client';

@Injectable()
export class FriendService {
	constructor (
		private readonly onlineService:OnlineService,
		private readonly databaseService:DatabaseService,
	){}

	private addStatus(data:UserInfoBase_noType):UserInfo_noType{
		const status = this.onlineService.getStatus(data.id);
		return {...data, status:status};
	}

	async getUserDetail(user_id: number) {
		const user = await this.databaseService.getUserFromId(user_id);
		return user;
	}

	async isFollowing(user_from: number, user_to: number): Promise<boolean> {
		const relation = await this.databaseService.followList.findMany({
			where: {
				followerId: user_from,
				followeeId: user_to,
			},
		})
		return relation.length ? true : false
	}

	async isBlocking(user_from: number, user_to: number): Promise<boolean> {
		const relation = await this.databaseService.blockedList.findMany({
			where: {
				userId: user_from,
				blockedUserId: user_to,
			},
		})
		return relation.length ? true : false
	}

	async getUserRelation(me: number, target: number, no_except:boolean=false) {
		const result_target = await this.getUserDetail(target)
		if (!result_target)
			throw new NotFoundException();

		const isBlocking = await this.isBlocking(me, target)
		const isFollowing = await this.isFollowing(me, target)
		const isFollowed = await this.isFollowing(target, me)

		if (!no_except && !isBlocking && !isFollowing && !isFollowed){
			throw new NotFoundException();
		}

		let relation: Reration;

		if (!isBlocking && !isFollowing && !isFollowed) {
			relation = 'OTHER';
		}
		else if (isBlocking) {
			relation = 'BLOCKING';
		} else {
			if (isFollowing && isFollowed)
				relation =  "FRIEND";
			else if (isFollowed)
				relation = "FOLLOWED";
			else
				relation = "FOLLOWING";
		}
		const {hashedPassword,createdAt,updatedAt,intraId,status, ...target_detail} = result_target;
		return {...target_detail, type: relation, status: this.onlineService.getStatus(target_detail.id)};
	}

	async followUser(me: number, target: number) {
		const isFollowing = await this.isFollowing(me, target)
		if (isFollowing)
			return ;

		await this.databaseService.followList.create({
			data: {
				followerId: me,
				followeeId: target
			},
		});
		return ;
	}

	async searchUser(name:string, sercher:number) {
		const user_list: UserInfo_noType[] = [];
		const user_list_add_func = ((v:UserInfoBase_noType)=>({...v,status: this.onlineService.getStatus(v.id)})).bind(this);
		return (await this.databaseService.serchUser(name, sercher)).rows.map(user_list_add_func);
	}

	async followUserWithAccess(result_me: Users, result_target: Users) {
		const {hashedPassword:a,createdAt:b,updatedAt:c,intraId:d,status:e, ...target_detail} = result_target;
		const {hashedPassword, createdAt, updatedAt, intraId, status, ...les} = result_me;
		const my_detail: UserInfo_noType = this.addStatus(les);

		await this.followUser(result_me.id, result_target.id);

		const isBlocked = await this.isBlocking(result_me.id, result_target.id);
		if (!isBlocked){
			const follow_event:FollowEvent = {data_type:'FOLLOW',content:my_detail}
			this.onlineService.sendData(target_detail.id , follow_event, 'FRIEND');
		}
		return target_detail;
	}

	async followById(me: number, target: number) {
		const result_target = await this.getUserDetail(target);
		const result_me = await this.getUserDetail(me);
		if (!result_target || !result_me)
			throw new NotFoundException();
		const user = await this.followUserWithAccess(result_me, result_target);
		return this.addStatus(user);
	}

	async blockById(me: number, target: number) {
		const blocklist = await this.databaseService.blockedList.findMany({
			where:{
				userId:me,
				blockedUserId:target
			}
		});
		if (blocklist.length)
			return ;
		await this.databaseService.blockedList.create({
			data:{
				userId:me,
				blockedUserId:target
			}
		});
		return;
	}

	async releaseById(me: number, target: number) {
		await this.databaseService.blockedList.deleteMany({
			where:{
				userId:me,
				blockedUserId:target
			}
		});
		const ret = await this.getUserRelation(me, target, true);
		return ret;
	}

	async followByEmail(me: number, target_email: string) {
		const result_target = await this.databaseService.users.findUnique({
			where: {
				email: target_email
			},
		});
		const result_me = await this.getUserDetail(me);
		if (!result_target || !result_me)
			throw new NotFoundException();
		return this.addStatus(await this.followUserWithAccess(result_me, result_target));
	}

	async getFriendList(userId: number) {
		const friend_list: UserInfo[] = [];
		const friend_list_add_func = ((v:UserInfoBase)=>{friend_list.push({...v,status: this.onlineService.getStatus(v.id)})}).bind(this);
		(await this.databaseService.getFriendList(userId)).rows.map(friend_list_add_func);
		(await this.databaseService.getFollowedList(userId)).rows.map(friend_list_add_func);
		(await this.databaseService.getFollowingList(userId)).rows.map(friend_list_add_func);
		(await this.databaseService.getBlockingList(userId)).rows.map(friend_list_add_func);
		return friend_list;
	}

	async getGameResult(user_id: number) {
		return await this.databaseService.getGameResult(user_id)
	}

	async getWinRate(user_id: number) {
		const game_results = await this.getGameResult(user_id);
		let num_game = 0;
		let num_win = 0;
		game_results.forEach((v) => {
			if (v.myScore > v.opponentScore)
				num_win += 1;
			num_game += 1;
		})
		return (num_game > 0 ? Math.round(num_win / num_game * 100) : 100)
	}
}
