import { FriendData } from "@/lib/types";
import Style from '../../styles/Friend.module.css';
import HomeStyles from '../../styles/Home_design.module.css';
import Link from "next/link";
import { FollowButton } from "./FollowButton";
import { UnBlockButton } from "./UnBlockButton";
import { BlockButton } from "./BlockButton";
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { AccessToken, RequestInit } from "@/pages/_app";

export function FriendInfo({data, friends, set_center, set_friend_list}:{data:FriendData, friends:Map<number, FriendData>, set_center:Function ,set_friend_list:Dispatch<SetStateAction<Map<number, FriendData>>>}){
	const [token] = useContext(AccessToken);
	const init = useContext(RequestInit)
	const [winrate, setWinrate] = useState<number>(100)
	const url_params = new URLSearchParams();
	const friend_data = friends.get(data.id) || data;

	url_params.append('select_user', friend_data.id.toString());

	useEffect(()=>{
		if (!token) {
			return ()=>{};
		}
		fetch('/backend/friend/winrate/' + friend_data.id, init).then(v => v.json()).then((v: number) => {
			setWinrate(v)
		})
	}, [token]);

	return (
		<div className={Style.click_part}>
			<div className={Style.info}>
				<img className={Style.info_img} src={friend_data.avatar} alt="User img"></img>
				<div className={Style.profile_name}>
					<p>{friend_data.nickname || friend_data.name}</p>
					{friend_data.nickname && <p className={HomeStyles.nick_name}>{friend_data.name}</p>}
					<h2 className={Style.Win_rate}>{winrate + '%'}</h2>
				</div>
				<div className={Style.buttom}>
					{(friend_data.type === 'FOLLOWED' || friend_data.type === 'OTHER') && <FollowButton id={friend_data.id} set_friend_data={set_friend_list}/>}
					{friend_data.type === 'BLOCKING' ? <UnBlockButton user={friend_data} set_friend_data={set_friend_list}/> : <BlockButton user={friend_data} set={set_friend_list}/>}
					{friend_data.type === 'FRIEND' && <Link className={Style.chat} href={`/chat/dm/${friend_data.id}`}>Chat</Link>}
					{friend_data.type === 'FRIEND' && <Link href={`/game?${url_params.toString()}`} className={Style.game_button}>game</Link>}
				</div>
				<span className={`bx bx-x ${Style.icon_info}`} onClick={()=>set_center(()=>null)}></span>
			</div>
		</div>
	);
}