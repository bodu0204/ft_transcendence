import { AccessToken, RequestInitPOST } from "@/pages/_app";
import { PasswordQuery } from "@/pages/chat/channel/[id]";
import { useContext, useState } from "react";
import Styles from '../../styles/Dm_design.module.css';

export function SendMessage({channel_id}:{channel_id:number}){
	const [b, set_b] = useState(true);
	const [message, set_message] = useState('');
	const init_base = useContext(RequestInitPOST);
	const [taken] = useContext(AccessToken);
	const [password, password_query] = useContext(PasswordQuery);
	function send(){
		if (!b || !taken || !message)
			return ;
		const url_params = new URLSearchParams();
		url_params.append('message', message);
		const init: RequestInit = {
			...init_base,
			body: url_params.toString()
		};
		set_b(_=>false);
		fetch(`/backend/chat/channel/${channel_id}` + ((password)?('?' + password_query.toString()):''), init).then(_=>{
			set_b(_=>true);
			set_message(_=>'');
		});
	}
	return (
		<div className={Styles.send_position}>
			<div className={Styles.send_msg}>
				<input className={Styles.text} type="text" placeholder="Type Your Message" onChange={e=>set_message(_=>e.target.value)} value={message}/>
				<button className={Styles.send_button} onClick={send}>{b?'send':'sending'}</button>
			</div>
		</div>
	);
}