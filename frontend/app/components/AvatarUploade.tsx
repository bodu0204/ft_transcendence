import { AccessToken, RequestInitFileUploade, MyInfo } from "@/pages/_app";
import { useContext, useState, ChangeEvent } from "react"
import { FriendData } from "@/lib/types";

export function AvatarUploade (){
	const [b, set_b] = useState(true);
	const init_base = useContext(RequestInitFileUploade);
	const [taken] = useContext(AccessToken);
	const [,set_me] = useContext(MyInfo);
	function onFileInputChange(e: ChangeEvent<HTMLInputElement>){
		const file = e.target.files?.item(0);
		if (!b || !taken || !file)
			return ;
		set_b(_=>false);
		const form_data = new FormData();
		form_data.append('avatar',file);
		const init = {
			...init_base,
			body:form_data
		}
		fetch(`/backend/avatar`, init).then(v=>v.json()).then((v:{avatar:string})=>{
			set_me((old:FriendData)=>({...old, avatar:v.avatar}));
			set_b(_=>true);
		});
	};
	return (
		<div>
			<input type='file' accept="image/jpeg" onChange={onFileInputChange} />
		</div>
	);
}