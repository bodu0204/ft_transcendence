export type Reration ="FOLLOWING" | "FOLLOWED" | "BLOCKING" | "FRIEND" | "OTHER"; 

export type UserInfoBase_noType = { 
	id:number;
	name:string;
	nickname:string | null;
	level:number;
	avatar:string;
	email:string;
}

export type GameResult = {
	id: number
	startedAt: string,
	myScore: number,
	opponentScore: number,
	opponentId: number,
	opponentName: string,
	opponentLevel: number,
	opponentEmail: string,
	opponentNickname: string,
	opponentAvatar: string
}

export type UserInfoBase = UserInfoBase_noType & { 
	type:Reration;
}

export type UserInfo_noType = UserInfoBase_noType & {
	status:string[];
}

export type UserInfo = UserInfoBase & { 
	status:string[];
}

export type FollowEvent = {
	data_type:'FOLLOW';
	content:UserInfo_noType;
};