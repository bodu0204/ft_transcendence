import { FriendData } from "@/lib/types";
import { AccessToken, RequestInit } from "@/pages/_app";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import Style from '../../styles/Friend.module.css';

export function BlockButton({user, set}:{user:FriendData, set:Dispatch<SetStateAction<Map<number, FriendData>>>}){
	const [b, set_b] = useState(true);
	const init = useContext(RequestInit);
	const [taken] = useContext(AccessToken);

	function block(){
	if (!b || !taken)
			return ;
		set_b(_=>false);
		fetch(`/backend/friend/block/${user.id}`, init).then(_=>{
		set_b(_=>true);
		set((old_value:Map<number, FriendData>)=>{
				const target = old_value.get(user.id) || user;
				if (target)
					target.type = 'BLOCKING';
				return new Map(old_value);
			});
		});
	}
	return (
		<button className={Style.block} onClick={block}>{b?'block':'blocking'}</button>
	);
}