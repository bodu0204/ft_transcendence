import { FriendData, UserAtChannel } from "@/lib/types";
import { AccessToken, RequestInit } from "@/pages/_app";
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { InviteLine } from "./InviteLine";
import Friend_style from '../../styles/Friend.module.css';
import Dm_styles from '../../styles/Dm_design.module.css';
import { ChatChannelCenter } from "@/pages/chat/channel/[id]";

type args = {
		channel_id:number;
		users:Map<number,UserAtChannel>;
		set_senter:Dispatch<SetStateAction<ChatChannelCenter>>
	}

export function Invite({channel_id, users, set_senter}:args){
	const [friendmap, set_friendmap] = useState(new Map<Number, FriendData>());
	const init = useContext(RequestInit);
	const [taken] = useContext(AccessToken);
	const friend_buf = new Map(friendmap);
	const friends:FriendData[] = [];
	useEffect(()=>{
		if (taken)
		{
			//自身のフレンド情報取得
			fetch(`/backend/friend`, init).then(v=>v.json()).then((v:FriendData[])=>{
				set_friendmap(old=>{
					v.forEach(vv=>old.set(vv.id, vv));
					return new Map(old);
				});
			});
		}
		return ()=>{};
	},[taken]);
	users.forEach((v,k)=>{
		if (v.authority !== 'LEFT')
			friend_buf.delete(k);
	});
	friend_buf.forEach(v=>{
		if (v.type !== 'BLOCKING')
			friends.push(v);
	});
	return (
		<div className={Friend_style.click_part}>
			<div className={Friend_style.info}>
				<div className={Dm_styles.invite_page}>
					{friends.map(v=><InviteLine key={v.email} user={v} channel_id={channel_id}/>)}
				</div>
			</div>
			<span className={`bx bx-x ${Friend_style.icon_info}`} onClick={()=>set_senter(_=>({datatype:'NOTHING'}))} ></span>
		</div>
	);
}