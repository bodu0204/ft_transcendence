import { AccessToken, MyInfo, RequestInitPUT } from "@/pages/_app";
import { useContext, useState } from "react";
import styles from '../../styles/Home_design.module.css';



export function SettingPass(){
	const [token] = useContext(AccessToken);
	const init_base = useContext(RequestInitPUT);
	const [pass, set_pass] = useState('');
	const [b, set_b] = useState(true);

	function setting(){
		if (!b || !token){
			return ;
		}
		set_b(_=>false);
		const url_params = new URLSearchParams();
		url_params.append('password', pass);
		const init: RequestInit = {
			...init_base,
			body: url_params.toString()
		};
		fetch(`/backend/password`,init).then(_=>{
			set_b(_=>true);
			set_pass(_=>'');
		});
	}

	return (<p>
		<input className={styles['input']} type="password" placeholder="Password" onChange={e=>set_pass(_=>e.target.value)}></input>
		{pass ? <button onClick={setting} className={styles.buttom_design}>{b?'change':'changing'}</button>: <></>}
	</p>);
}