import { ChatChannelCenter } from "@/pages/chat/channel/[id]";
import { Dispatch, SetStateAction } from "react";
import { BackPage } from "./BackPage";
import { PasswordReq } from "./PasswordReq";
import { Invite } from "./Invite";
import { ChannelOfUser, UserAtChannel } from "@/lib/types";
import { UserControls } from "./UserControls";
import { ChangeAccess } from "./ChangeAccess";

type arg = {
	senter_data:ChatChannelCenter;
	set_senter_data:Dispatch<SetStateAction<ChatChannelCenter>>;
	set_pass:Dispatch<SetStateAction<string|null>>;
	channel:ChannelOfUser;
	users:Map<number, UserAtChannel>;
};

export function ChatCenter({senter_data, set_senter_data, set_pass, channel, users}:arg) {
	const {datatype, content} = senter_data;

	return(datatype === 'NEED_PASS'?<>
		<PasswordReq set={set_pass}/>
	</>:datatype === 'CHANNEL_CONTROLE'?<>
		<ChangeAccess channel={channel} set_senter={set_senter_data} />
	</>:datatype === 'HUNGIUP'?<>
		<BackPage message={content} />
	</>:datatype === 'INVITE'?<>
		<Invite channel_id={channel.id} users={users} set_senter={set_senter_data} />
	</>:datatype === 'MEMBER_CONTROLE'?<>
		<UserControls user={users.get(content.id)||content} channel_id={channel.id} my_authority={channel.authority} set_senter={set_senter_data} />
	</>:<></>);
}