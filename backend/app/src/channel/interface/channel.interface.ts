export type UserAuthorityBasic = 'OWNER' | 'ADMINISTRATOR' | 'MEMBER' | 'LEFT' | 'BANNED';
export type UserAuthority = UserAuthorityBasic | 'MUTED';
export type UserAtChannelBase = {
	id: number;
	name: string;
	nickname: string | undefined;
	level: number;
	avatar: string;
	email: string;
	authority: UserAuthority;
	mutedUntil?: Date;
};
export type UserAtChannel = UserAtChannelBase & {
	status: string[]
};
export type ChannelAccess = 'PRIVATE' | 'PROTECTED' | 'PUBLIC';
export type ChannelOfUser = {
	id: number;
	name: string;
	access: ChannelAccess;
	authority: UserAuthorityBasic;
};

export type NewChannelEvent={
	data_type: 'NEW',
	content: ChannelOfUser
}

export type DelChannelEvent={
	data_type: 'DEL',
	content: {
		authority: 'LEFT' | 'BANNED',
		id: number
	}
}

export type AccessChannelEvent={
	data_type: 'ACCESS',
	content: {
		id: number;
		access: ChannelAccess;
	}
}

export type ChannelEvent = NewChannelEvent | DelChannelEvent | AccessChannelEvent;

export type KickInfo = {
	message: string
};

export type ChannelBaseInfo = {
	channel: ChannelOfUser,
	users?: UserAtChannel[]
};

export type ChatEventType = 'USER' | 'KICK' | 'MESSAGE'
