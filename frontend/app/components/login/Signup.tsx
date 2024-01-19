import { ChangeEvent, useState } from "react";
import styles from '../../styles/Login_part.module.css';

export function Signup(){
	const [b, set_b] = useState(true);
	const [e_mail, set_e_mail] = useState('');
	const [pass, set_pass] = useState('');
	const [name, set_name] = useState('');
	const [message, set_message] = useState('');
	const init_base = {
		method: "POST",
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	};
	function send(){
		if (!b)
			return ;
		if (!e_mail || !pass || !name){
			set_message(_=>'Blank space available');
			return ;
		}
		const url_params = new URLSearchParams();
		url_params.append('email', e_mail);
		url_params.append('password', pass);
		url_params.append('name', name);
		const init: RequestInit = {
			...init_base,
			body: url_params.toString()
		};
		set_b(_=>false);
		fetch('/backend/auth/pre_signup', init).then(v=>{
			set_b(_=>true);
			if (Math.floor( v.status / 100) !== 2){
				set_message(_=>'Please input correct information');
			}
			set_e_mail(_=>'');
			set_pass(_=>'');
			set_name(_=>'');
			set_message(_=>'Please complete your registration from your mailbox');
			return ;
		});
	}
	function change_e_mail(v:ChangeEvent<HTMLInputElement>){
		return set_e_mail(_=>v.target.value);	
	}
	function change_pass(v:ChangeEvent<HTMLInputElement>){
		return set_pass(_=>v.target.value);	
	}
	function change_name(v:ChangeEvent<HTMLInputElement>){
		return set_name(_=>v.target.value);	
	}
	return (<>
		<h2 className={styles.font}>New user</h2>
		<div className={styles.Login_font}>
			{message ? <p className={styles.message_design}>{message}</p> : <></>}
			<div className={styles.Input_Box}>
				<input className={styles['input']} type="text" onChange={change_e_mail} value={e_mail} placeholder="Email"></input>
			</div>

			<div className={styles.Input_Box}>
				<input className={styles['input']} type="password" onChange={change_pass} value={pass} placeholder="Password"></input>
			</div>
			
			<div className={styles.Input_Box}>
				<input className={styles['input']} type="text" onChange={change_name} value={name} placeholder="Name"></input>
			</div>
				<div className={styles.Login_part}>
					<input onClick={send} type="submit" name="Signup-button" value={b?'Register':'Registering'}/>
				</div>
		</div>
	</>);
}