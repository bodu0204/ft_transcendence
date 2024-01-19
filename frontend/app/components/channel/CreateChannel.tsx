import { Dispatch, SetStateAction, useContext, useState } from "react";
import { AccessToken, RequestInitPOST } from "@/pages/_app";
import { ChannelOfUser } from "@/lib/types";
import Style from '../../styles/Friend.module.css';

export function CreateChannel({set}:{set:Dispatch<SetStateAction<Map<number, ChannelOfUser>>>}){
	const [type, set_type] = useState('PUBLIC');
	const [password, set_password] = useState('');
	const [name, set_name] = useState('');
	const [b, set_b] = useState(true);
	const [taken] = useContext(AccessToken);
	const init_base = useContext(RequestInitPOST);

	function create(){
		if (!b || !taken)
		return ;
		const url_params = new URLSearchParams();
		url_params.append('mame', name);
		url_params.append('type', type);
		if (type === 'PROTECTED')
			url_params.append('password', password);
		const init: RequestInit = {
			...init_base,
			body: url_params.toString()
		};
		set_b(_=>false);
		fetch(`/backend/channel`, init).then(v=>v.json()).then((v:ChannelOfUser)=>{
			set((old:Map<number,ChannelOfUser>)=>{
				old.set(v.id, v);
				return new Map(old);
			});
			set_type(_=>'PUBLIC');
			set_password(_=>'');
			set_name(_=>'');
			set_b(_=>true);
		});
	}

	return(<>
		<div className={Style.type} >Type :
			<select className={Style.option} value={type} onChange={e=>set_type(_=>e.target.value)}>
				<option value="PUBLIC">PUBLIC</option>
				<option value="PROTECTED">PROTECTED</option>
				<option value="PRIVATE">PRIVATE</option>
			</select>
		</div>
		<div className={Style.type}>Name :
			<input type="text" value={name} onChange={e=>set_name(_=>e.target.value)}/>
		</div>
		{type==='PROTECTED' && <div className={Style.type}>Password :
			<input type="password" value={password} onChange={e=>set_password(_=>e.target.value)}/>
		</div>}
		{(type && name && (type==='PROTECTED'? password :true))?<button className={Style.button_create} onClick={create}>Create</button>:<></>}
	</>);
}