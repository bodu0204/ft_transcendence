import { KickInfo, UserAtChannel } from "src/channel/interface/channel.interface"

type EventData = {
	data_type:string
	data:object
}

export type Message = {
	id:number;
	userId:number;
	createdAt:Date;
	context:string
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

export type ChatEvent = ChannelUserEvent | ChannelKickEvent | ChatMessageEvent;

