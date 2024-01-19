import { AccessToken, RequestInitDELETE, RequestInitPUT } from "@/pages/_app";
import { useContext, useState } from "react";
import Styles from '../../styles/Dm_design.module.css';

export function TakeAdmin({user_id,chanel_id}:{user_id:number, chanel_id:number}){
	const [b, set_b] = useState(true);
	const init_base = useContext(RequestInitDELETE);
	const [taken] = useContext(AccessToken);
	const url_params = new URLSearchParams();
	url_params.append('user', user_id.toString());
	const init:RequestInit={
		...init_base,
		body:url_params.toString()
	}
	function take_admin(){
		if (!b || !taken)
			return ;
		set_b(_=>false);
		fetch(`/backend/channel/admin/${chanel_id}`, init).then(_=>{
			set_b(_=>true);
		});
	}
	return (
		<button className={Styles.bt_styles} onClick={take_admin}>{b?'take admin':'takeing admin'}</button>
	);
}