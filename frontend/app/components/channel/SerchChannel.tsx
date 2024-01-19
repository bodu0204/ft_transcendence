import { ChannelOfUser } from "@/lib/types";
import { ChangeEvent, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { AccessToken, RequestInitPUT } from "@/pages/_app";
import Home_style from '../../styles/Home_design.module.css';
import Friend_style from '../../styles/Friend.module.css';

type args = {
	channel_data:Map<number, ChannelOfUser>;
	set_center_data:Dispatch<SetStateAction< null | "CREATE_CHANNEL" | ChannelOfUser>>;
}

export function SerchChannel({channel_data, set_center_data}:args){
	const [inpit, set_input] = useState('');
	const [channels, set_channels] = useState([] as ChannelOfUser[]);
	const init_base = useContext(RequestInitPUT);
	const [taken] = useContext(AccessToken);
	useEffect(()=>{
		serch(inpit);
	},[channel_data]);
	function serch(e:ChangeEvent<HTMLInputElement> | string){
		const serch_target = typeof e === 'string'? e : e.target.value;
		set_input(_=>serch_target);
		if (!taken || !serch_target)
			return ;
		const url_params = new URLSearchParams();
		url_params.append('mame', serch_target);
		const init: RequestInit = {
			...init_base,
			body: url_params.toString()
		};
		fetch(`/backend/channel`, init).then(v=>{
			if (Math.floor( v.status / 100) !== 2)
				throw 'error';
			return v.json();
		}).then((v:ChannelOfUser[])=>{
			set_channels(_=>v);
		});
	}
	return(
		<div className={Friend_style.find_friends_box}>
			<div className={Friend_style.search}>
				<input type="text" placeholder='Search Channel :)' className={Friend_style.find_friends} onChange={serch} value={inpit} />
			</div>
			{channels.map(v=>(
			<div key={v.id} className={`${Home_style.friends}`} onClick={()=>{set_center_data((_:any)=>v);}}>
				<h1 className={Home_style.name}>{v.name}</h1>
			</div>))}
		</div>
	);
}