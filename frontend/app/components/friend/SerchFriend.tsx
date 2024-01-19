import { FriendData, FriendDataBasic } from "@/lib/types";
import { AccessToken, RequestInit, RequestInitPUT } from "@/pages/_app";
import { ChangeEvent, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { FriendList } from "./FriendList";
import Style from '../../styles/Friend.module.css';

type args = {
	friend_data:Map<number, FriendData>;
	center:[null|FriendData,Dispatch<SetStateAction<null|FriendData>>];
}

export function SerchFriend({friend_data, center}:args){
	const [inpit, set_input] = useState('');
	const [friends, set_friends] = useState([] as FriendData[]);
	const init = useContext(RequestInit);
	const [taken] = useContext(AccessToken);
	const [,set_center_data] = center;

	useEffect(()=>{
		set_center_data((old)=>(old? friend_data.get(old.id)|| old :null));
		return ()=>{};
	},[friend_data]);

	function serch(e:ChangeEvent<HTMLInputElement>){
		set_input(_=>e.target.value);
		if (!taken)
			return ;
		const url_params = new URLSearchParams();
		url_params.append('name', e.target.value);
		fetch(`/backend/friend/search?${url_params.toString()}`, init).then(v=>v.json())
		.then((v:FriendDataBasic[])=>{
			set_friends(_=>(
				v.map(val=>({
					...val,
					type: friend_data.get(val.id)?.type || 'OTHER',
				}))
			));
		});
	}
	return(
		<div className={Style.find_friends_box}>
			<div className={Style.search}>
				<input type="text" placeholder='Find New Frineds :)' className={Style.find_friends} onChange={serch} value={inpit}></input>
			</div>
			<FriendList data={friends} status="HOME" set_center_data={set_center_data}/>
		</div>
	);
}