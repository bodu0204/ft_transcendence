import { Dispatch, SetStateAction, useContext, useState } from "react";
import { AccessToken, RequestInitPUT } from "@/pages/_app";
import { ChannelAccess, ChannelOfUser } from "@/lib/types";
import Friend_style from '../../styles/Friend.module.css';
import Dm_styles from '../../styles/Dm_design.module.css';
import { ChatChannelCenter } from "@/pages/chat/channel/[id]";

type args = {
	channel:ChannelOfUser;
	set_senter:Dispatch<SetStateAction<ChatChannelCenter>>
}

export function ChangeAccess({channel, set_senter}:args){
	const [type, set_type] = useState(channel.access);
	const [password, set_password] = useState('');
	const [b, set_b] = useState(true);
	const [taken] = useContext(AccessToken);
	const init_base = useContext(RequestInitPUT);

	const url_params = new URLSearchParams();
	url_params.append('access', type);
	if (type === 'PROTECTED')
		url_params.append('new_password', password);
	
	function change(){
		if (!b || !taken)
		return ;
		if (type === 'PROTECTED')
			url_params.append('password', password);
		const init: RequestInit = {
			...init_base,
			body: url_params.toString()
		};
		set_b(_=>false);
		fetch(`/backend/channel/access/${channel.id}`, init).then(_=>{
			set_password(_=>'');
			set_b(_=>true);
		});
	}


	return(
		<div className={Friend_style.click_part}>
			<div className={Friend_style.info}>
				<div className={Dm_styles.change_group_authority}>
					<h1 className={Dm_styles.font}>setting group</h1>
					<div className={Dm_styles.type} >Type : 
						<select className={Dm_styles.option} value={type} onChange={e=>set_type(_=>e.target.value as ChannelAccess)}>
							<option value="PUBLIC">PUBLIC</option>
							<option value="PROTECTED">PROTECTED</option>
							<option value="PRIVATE">PRIVATE</option>
						</select>
					</div>
					{type==='PROTECTED' && <div className={Dm_styles.type}>Password :
						<input type="password" value={password} onChange={e=>set_password(_=>e.target.value)}/>
					</div>}
					{(type && ((type==='PROTECTED' && password) || (type!=='PROTECTED' && type !== channel.access)))?<button onClick={change}>change</button>:<></>}
				</div>
			</div>
			<span className={`bx bx-x ${Friend_style.icon_info}`} onClick={()=>set_senter(v=>{
					if (v.datatype === 'HUNGIUP' || v.datatype ==='NEED_PASS')
						return v;
					return {datatype:'NOTHING'};
				})} />
		</div>
	);
}