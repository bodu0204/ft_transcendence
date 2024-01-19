import { FriendData } from "@/lib/types";
import { AccessToken, RequestInitPUT } from "@/pages/_app";
import { PasswordQuery } from "@/pages/chat/channel/[id]";
import { useContext, useState } from "react";
import Styles from '../../styles/Dm_design.module.css';

export function InviteLine({user, channel_id}:{user:FriendData,channel_id:number}){
	const [b, set_b] = useState(true);
	const [taken] = useContext(AccessToken);
	const init_base = useContext(RequestInitPUT);
	const [password, password_query] = useContext(PasswordQuery);

	const url_params = new URLSearchParams();
	url_params.append('user', user.id.toString());
	const init: RequestInit = {
		...init_base,
		body: url_params.toString()
	};

	function invite(){
		if (!b || !taken)
			return ;
		set_b(_=>false);
		fetch(`/backend/channel/invite/${channel_id}` + ((password)?('?' + password_query.toString()):''), init).then(v=>{
			set_b(_=>true);
		});
	}
	return (
		<div className={Styles.invite_members} onClick={invite}>
			<img className={Styles.friend_img} src={user.avatar} alt="Game image"></img>
			<h1 className={Styles.name}>{user.nickname || user.name}</h1>
		</div>
	);
}