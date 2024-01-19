import { Message } from "@/lib/types";
import { AccessToken, RequestInitPOST } from "@/pages/_app";
import { ChangeEvent, useContext, useState } from "react";
import Styles from '../../styles/Dm_design.module.css';

export function SendeDm({chat_id ,set}:{chat_id:string, set:Function}){
	const [b, set_b] = useState(true);
	const [message, set_message] = useState('');
	const init_base = useContext(RequestInitPOST);
	const [taken] = useContext(AccessToken);
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
		fetch(`/backend/chat/dm/${chat_id}`, init).then(v=>v.json()).then((v:Message)=>{
			set((old_value:Message[])=>{
				set_b(_=>true);
				set_message(_=>'');
				return [...old_value, v];
			});
		});
	}
	function change(v:ChangeEvent<HTMLInputElement>){
		return set_message(_=>v.target.value);	
	}
	return (
		<div className={Styles.send_position}>
			<div className={Styles.send_msg}>
				<input className={Styles.text} onChange={change} value={message} type="text" placeholder="Type Your Message" />
				<button className={Styles.send_button}onClick={send}>{b?'send':'sending'}</button>
			</div>
		</div>
	);
}