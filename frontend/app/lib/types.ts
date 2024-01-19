export type FollowEvent = {
	data_type:'FOLLOW';
	content:{
		id:number;
		name:string;
		nickname:string;
		level:number;
		avatar:string;
		email:string;
		status:string[];	
	};
};
export type StatusEvent = {
	data_type:'STATUS';
	content:{
		id:number;
		status:string[];
	};
};
export type FriendEvent = StatusEvent | FollowEvent;

export type FriendType = 'FRIEND'|'FOLLOWING'|'FOLLOWED'|'BLOCKING'|'OTHER';
export type FriendDataBasic = {
	id: number;
	name: string;
	nickname: string;
	level: number;
	avatar: string;
	email: string;
	status:string[];
};

export type FriendData = {
	id: number;
	name: string;
	nickname: string;
	level: number;
	avatar: string;
	email: string;
	status:string[];
	type: FriendType;
};

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

export type Message = {
	id:number;
	userId:number;
	createdAt:Date;
	context:string
};
export type DmEvent = {message_id:number, sender:number, message:string};

export type UserAuthorityBasic = 'OWNER' | 'ADMINISTRATOR' | 'MEMBER' | 'LEFT' | 'BANNED';
export type ChannelAccess = 'PRIVATE' | 'PROTECTED' | 'PUBLIC';
export type ChannelOfUser = {
	id:number;
	name:string;
	access: ChannelAccess;
	authority: UserAuthorityBasic;
};

export type NewChannelEvent={
	data_type:'NEW',
	content:ChannelOfUser
}

export type DelChannelEvent={
	data_type:'DEL',
	content:{
		authority:'LEFT' | 'BANNED',
		id:number	
	}
}

export type AccessChannelEvent={
	data_type:'ACCESS',
	content:{
		id:number;
		access: ChannelAccess;
	}
}

export type ChannelEvent = NewChannelEvent | DelChannelEvent | AccessChannelEvent;

export type UserAuthority = UserAuthorityBasic | 'MUTED';
export type UserAtChannel = {
	id:number;
	name:string;
	nickname:string | undefined;
	level:number;
	avatar:string;
	status:string[];
	email:string;
	authority:UserAuthority;
	mutedUntil?:string;
};

export type ChannelBaseInfo = {
	channel:ChannelOfUser,
	users?:UserAtChannel[]
};

export type KickInfo = {
	message:string
};

export type ChannelUserEvent = {
	data_type:'USER',
	content:UserAtChannel
}

export type ChannelKickEvent = {
	data_type:'KICK',
	content:KickInfo
}

export type ChatMessageEvent = {
	data_type:'MESSAGE',
	content:Message
}

export type ChatEvent = ChannelUserEvent | ChannelKickEvent | ChatMessageEvent | StatusEvent;

export type DMEvent = ChatMessageEvent;

export type Taken = {
	access_token: string;
}

export type FriendDisp = "HOME" | "FRIEND" | "ADD" | "BLOCK";
export type ChannelDisp = "CHANNEL";
export type UserDisp = FriendDisp | ChannelDisp;

