import { UserAtChannel } from "@/lib/types";
import { AccessToken, RequestInitPUT } from "@/pages/_app";
import { useContext, useState } from "react";
import Styles from '../../styles/Dm_design.module.css';

export function MuteInput({chanel_id, user}:{chanel_id:number,user:UserAtChannel}){
	const now_date = new Date(Date.now());
	const [b, set_b] = useState(true);
	const init_base = useContext(RequestInitPUT);
	const [taken] = useContext(AccessToken);
	const [date, set_date] = useState(user.mutedUntil ? new Date(user.mutedUntil) : now_date);
	const url_params = new URLSearchParams();
	url_params.append('user', user.id.toString());
	url_params.append('until', date.toISOString());

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const formattedDate = date > now_date ? `${year}-${month}-${day}T${hours}:${minutes}`:'';

	const init:RequestInit={
		...init_base,
		body:url_params.toString()
	}
	function mute(){
		if (!b || !taken)
			return ;
		set_b(_=>false);
		fetch(`/backend/channel/mute/${chanel_id}`, init).then(_=>{
			set_b(_=>true);
		});
	}
	return (<>
		<input type="datetime-local" onChange={e=>set_date(_=>new Date(e.target.value || Date.now()))} value={formattedDate}/>
		<button className={Styles.bt_styles} onClick={mute}>{b?'mute':'muting'}</button>
	</>);
}
