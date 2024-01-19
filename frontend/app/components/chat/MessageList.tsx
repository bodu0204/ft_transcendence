import { FriendData, Message, UserAtChannel } from "@/lib/types";
import { MessageLine } from "./MessageLine";
import Styles from '../../styles/Dm_design.module.css';
import { useContext, useEffect, useState } from "react";
import { AccessToken, RequestInit } from "@/pages/_app";

export function MessageList({messages, users}:{messages:Map<number,Message>, users:Map<number,UserAtChannel>}){
	const msg_arr :Message[]= [];
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
				return new Map(ret);
			});
		});
		return ()=>{};
	}, [taken]);

	messages.forEach(v=>{
		msg_arr.push(v);
		return ;
	});

	return (
		<div className={Styles.positions}>
			{msg_arr.map((v)=><MessageLine key={v.id} message={friends.get(v.userId)?.type !== 'BLOCKING' ? v : {...v, context:'unblock to show messages'}} user={users.get(v.userId) as UserAtChannel}/>)}
		</div>
	);
}