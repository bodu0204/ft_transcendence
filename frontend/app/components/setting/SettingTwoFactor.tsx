import { AccessToken, RequestInit, RequestInitPOST } from "@/pages/_app";
import { useContext, useEffect, useState } from "react";
import { FriendData } from "@/lib/types";
import Styles from '../../styles/Home_design.module.css';



export function SettingTwoFactor(){
	const [token] = useContext(AccessToken);
	const init_post = useContext(RequestInitPOST);
	const init = useContext(RequestInit);
	const [b, set_b] = useState(true);
	const [tow_fact, set_twofac] = useState(null as'ON'|'OFF'|null);

	useEffect(()=>{
		fetch(`/backend/twoFactor`,init).then(v=>v.json()).then(({isAuthentication}:{isAuthentication:'ON'|'OFF'})=>{
			set_twofac(_=>isAuthentication);
		});
	},[token]);
	function setting(){
		if (!b || !token){
			return ;
		}
		set_b(_=>false);
		fetch(`/backend/twoFactor`,init_post).then(v=>{
			return v.json();
		}).then(({isAuthentication}:{isAuthentication:'ON'|'OFF'})=>{
			set_b(_=>true);
			set_twofac(_=>isAuthentication);
		});
	}

	return (
		<div className={Styles.container}>
				<p>Two-Factor Authentication Button</p>
			{tow_fact && <div className={tow_fact==='ON' ? Styles.on : Styles.off} onClick={setting}>
				<input type="checkbox" />
			</div>}
		</div>
	);
}