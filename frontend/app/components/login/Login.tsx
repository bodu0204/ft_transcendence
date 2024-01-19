import { AccessToken } from "@/pages/_app";
import { useRouter } from "next/router";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import { Signup } from "./Signup";
import styles from '../../styles/Login_part.module.css';
import { Taken } from "@/lib/types";


export function Login(){
	const [jwt, set_jwt] = useContext(AccessToken);
	const router = useRouter();
	const [login_signup, set_login_signup] = useState(true);
	const [b, set_b] = useState(true);
	const [e_mail, set_e_mail] = useState('');
	const [pass, set_pass] = useState('');
	const init_base = {
		method: "POST",
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	};
	useEffect(()=>{
		if (!jwt){
			const {code,one_time_token} = router.query;
			if (typeof code === 'string'){
				const query = new URLSearchParams();
				query.append('code', code);
				fetch(`/backend/auth/verify?${query.toString()}`)
				.then((res)=>res.json())
				.then((obj)=>{
					if(typeof obj === 'object' 
					&& typeof (obj as {access_token?:string}).access_token === 'string'){
						set_jwt(()=>(obj.access_token));
						router.replace('/');
					}
					return ;
				})
				.catch(()=>{return ;});
			}else if(typeof one_time_token === 'string'){
				fetch(`/backend/auth/signup/${one_time_token}`)
				.then((res)=>res.json())
				.then((obj)=>{
					if(typeof obj === 'object' 
					&& typeof (obj as {access_token?:string}).access_token === 'string'){
						set_jwt(()=>(obj.access_token));
						router.replace('/');
					}
					return ;
				})
				.catch(()=>{return ;});
			}
		}
	},[router]);
	function send(){
		if (!b || !e_mail || !pass){
			return ;
		}
		const url_params = new URLSearchParams();
		url_params.append('email', e_mail);
		url_params.append('password', pass);
		const init: RequestInit = {
			...init_base,
			body: url_params.toString()
		};
		set_b(_=>false);
		fetch('/backend/auth/login', init).then(v=>{
			if (Math.floor( v.status / 100) !== 2){
				throw 'error';
			}
			return v.json();
		}).then((v:Taken)=>{
			set_jwt((_:String)=>{
				set_b(_=>true);
				set_e_mail(_=>'');
				set_pass(_=>'');
				return v.access_token;
			});
		}).catch(_=>{
			set_jwt(_=>{
				set_b(_=>true);
				return '';
			});
		});
	}
	function change_e_mail(v:ChangeEvent<HTMLInputElement>){
		return set_e_mail(_=>v.target.value);	
	}
	function change_pass(v:ChangeEvent<HTMLInputElement>){
		return set_pass(_=>v.target.value);	

	}
	return (
		<div className={styles.body_part}>
			<div className={styles.Login_Box}>
				{login_signup? <>
					<h1 className={styles.font}>Login</h1>
					<div className={styles.Input_Box}>
						<input className={styles['input']} type="text" onChange={change_e_mail} value={e_mail} placeholder="Email"></input>
					</div>
					<div className={styles.Input_Box}>
						<input className={styles['input']} type="password" onChange={change_pass} value={pass} placeholder="Password"></input>
					</div>
					<div className={styles.Login_part}>
						<input onClick={send} type="submit" name="login-button" value={b?'Login':'...'}></input>
					</div>
					<div className={styles.another_login}>
					</div>
					{/* 42アカウントでログイン設定 */}
					<div className={styles.signup_part}>
						<p>Are you a student?
							<a className={styles.link_design} href="/backend/auth/redirect">   42 account</a> 
						</p>					
					</div>
				</> : <>
					<Signup />
				</>}
				{/* ここに普通のログイン方法の設定 */}
				<div className={styles.signup_part}>
					{login_signup ? 'Don\'t have an account?' : ''}
					<a className={styles.link_design} onClick={_=>{set_login_signup(v=>!v)}}>   {login_signup ? 'create acount': 'back to login'}</a>
				</div>
			</div>
		</div>
	);
}