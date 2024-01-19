import { FollowEvent, FriendData } from "@/lib/types";
import { update_folloing_friend_type } from "@/lib/update_friend_type";
import { AccessToken, RequestInit } from "@/pages/_app";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import Style from '../../styles/Friend.module.css';


type args={
	id:number;
	set_friend_data:Dispatch<SetStateAction<Map<number, FriendData>>>;
	css_style?:{readonly [key: string]: string;}
	}
export function FollowButton({id, set_friend_data, css_style}:args){
	const [b, set_b] = useState(true);
	const init = useContext(RequestInit);
	const [taken] = useContext(AccessToken);
	const style = css_style?.bt_styles || Style.follow;
	function follow(){
		if (!b || !taken)
			return ;
		set_b(_=>false);
		fetch(`/backend/friend/follow/${id}`, init).then(v=>v.json()).then((v:FriendData)=>{
			set_b(_=>true);
			set_friend_data((old:Map<number, FriendData>)=>{
				old.set(id,{...v, type:update_folloing_friend_type(old.get(v.id)?.type)});
				return new Map(old);
			});
		});
	}
	return (
		<button className={style} onClick={follow}>{b?'follow':'following'}</button>
	);
}
