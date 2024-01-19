import { FriendData, UserAtChannel, UserAuthority } from "@/lib/types";
import { BanButton } from "./BanButton";
import { KickButton } from "./KickButton";
import { MuteInput } from "./MuteInput";
import { UnbanButton } from "./UnbanButton";
import { TakeAdmin } from "./TakeAdmin";
import { GiveAdmin } from "./GiveAdmin";
import Friend_style from '../../styles/Friend.module.css';
import Dm_styles from '../../styles/Dm_design.module.css';
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { ChatChannelCenter } from "@/pages/chat/channel/[id]";
import { FollowButton } from "../friend/FollowButton";
import { AccessToken, RequestInit } from "@/pages/_app";

type args = {
	user:UserAtChannel;
	channel_id:number;
	my_authority:UserAuthority;
	set_senter:Dispatch<SetStateAction<ChatChannelCenter>>
}

export function UserControls({user,channel_id,my_authority,set_senter}:args){
	const [friends, set_friends] = useState(new Map<number, FriendData>());
	const [taken] = useContext(AccessToken);
	const init = useContext(RequestInit);

	useEffect(()=>{
		if (!taken) {
			return ()=>{};
		}
		fetch('/backend/friend',init).then(v=>v.json()).then((v:FriendData[])=>{
			set_friends((_)=>{
				const ret = new Map<number, FriendData>();
				v.forEach((v)=>{
					ret.set(v.id, v);
				});
				return ret;
			});
		});
		return ()=>{};
	}, [taken]);
	const relation = friends.get(user.id)?.type;
	return(<>
		<div className={Friend_style.click_part}>
			<div className={Friend_style.info}>
				<div className={Dm_styles.authority}>
					<div className={Dm_styles.user_authority}>
						<img className={Dm_styles.authority_img} src={user.avatar} alt="Game image"></img>
						<p className={Dm_styles.user_name}>{user.nickname || user.name}</p>
					</div>
					<div className={Dm_styles.button}>
						{((my_authority==='ADMINISTRATOR' || my_authority==='OWNER') && !(user.authority==='ADMINISTRATOR' || user.authority==='OWNER'))&& <>
							{user.authority==='BANNED'?
								<UnbanButton chanel_id={channel_id} user_id={user.id} />
							:<>
								<BanButton chanel_id={channel_id} user_id={user.id} />
								{user.authority!=='LEFT' && <KickButton chanel_id={channel_id} user_id={user.id} />}
								<MuteInput chanel_id={channel_id} user={user} />
							</>}
						</>}
						{my_authority==='OWNER'&& <>
							{user.authority==='ADMINISTRATOR'?
								<TakeAdmin chanel_id={channel_id} user_id={user.id} />
							:
								<GiveAdmin chanel_id={channel_id} user_id={user.id} />
							}
						</>}
						{(!relation || relation==='FOLLOWED')&& <FollowButton id={user.id} set_friend_data={set_friends} css_style={Dm_styles}/>}
						
					</div>
				</div>
			</div>
			<span className={`bx bx-x ${Friend_style.icon_info}`} onClick={()=>set_senter(_=>({datatype:'NOTHING'}))} ></span>
		</div>
	</>);
}