import { FriendData } from "@/lib/types";
import { AccessToken, RequestInit } from "@/pages/_app";
import { useContext, useState } from "react";
import Style from '../../styles/Friend.module.css';

export function UnBlockButton({user, set_friend_data}:{user:FriendData,set_friend_data:Function}){
	const [b, set_b] = useState(true);
	const init = useContext(RequestInit);
	const [taken] = useContext(AccessToken);
	function release(){
		if (!b || !taken)
			return ;
		set_b(_=>false);
		fetch(`/backend/friend/release/${user.id}`, init).then(v=>v.json()).then((v:FriendData)=>{
			set_b(_=>true);
			set_friend_data((old_value:Map<number, FriendData>)=>{
				const target = old_value.get(user.id)||user;
				if (target)
					target.type = v.type;
				return new Map(old_value);
			});
		});
	}
	return (
		<button className={Style.block} onClick={release}>{b?'unblock':'unblocking'}</button>
	);
}