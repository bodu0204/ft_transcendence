import { AccessToken, MyInfo, RequestInitPUT } from "@/pages/_app";
import { useContext, useState, ChangeEvent } from "react";
import styles from '../../styles/Home_design.module.css';
import { FriendData } from "@/lib/types";



export function SettingName(){
	const [token] = useContext(AccessToken);
	const init_base = useContext(RequestInitPUT);
	const [,set_me] = useContext(MyInfo);
	const [name, set_name] = useState('');
	const [b, set_b] = useState(true);

	function setting(){
		if (!b || !token){
			return ;
		}
		set_b(_=>false);
		const url_params = new URLSearchParams();
		url_params.append('nickname', name);
		const init: RequestInit = {
			...init_base,
			body: url_params.toString()
		};
		fetch(`/backend/nickname`,init).then(v=>v.json()).then((v:{nickname:string})=>{
			set_me((old:FriendData)=>({...old, nickname:v.nickname}));
			set_b(_=>true);
			set_name(_=>'');
		});
	}

	return (<p>
		<input className={styles['input']} type="text" placeholder="Nick Name" onChange={e=>set_name(_=>e.target.value)}></input>
		{name ? <button onClick={setting} className={styles.buttom_design}>{b?'change':'changing'}</button>: <></>}
	</p>);
}