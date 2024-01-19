import { Dispatch, SetStateAction, useState } from "react";
import Friend_style from '../../styles/Friend.module.css';
import Dm_styles from '../../styles/Dm_design.module.css';

export function PasswordReq({set}:{set:Dispatch<SetStateAction<string|null>>}){
	const [password, set_password] = useState('');

	return (<>
			<div className={Friend_style.click_part}>
			<div className={Friend_style.info}>
				<div className={Dm_styles.passwd_page}>
					<span className={`bx bxs-lock-alt ${Dm_styles.lock_icons}`}></span>
					<input className={Dm_styles.passwd} type="password" placeholder="Enter Password" onChange={e=>set_password(e.target.value)} value={password}></input>
					<button className={Dm_styles.bt} onClick={_=>{
						set(()=>password);
						set_password(_=>'');
					}}>Enter</button>
				</div>
			</div>
		</div>
	</>);
}