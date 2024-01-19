import { ChannelOfUser } from "@/lib/types";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import Style from '../../styles/Friend.module.css';
import Link from "next/link";
import { AccessToken, RequestInitDELETE } from "@/pages/_app";
import { CreateChannel } from "./CreateChannel";

type args = {
	center:[ null | "CREATE_CHANNEL" | ChannelOfUser, Dispatch<SetStateAction< null | "CREATE_CHANNEL" | ChannelOfUser>>];
	set: Dispatch<SetStateAction<Map<number, ChannelOfUser>>>;
}

export function ChannelCenter({center, set}:args){
	const [center_data, set_center_data] = center;
	const [b, set_b] = useState(true);
	const [taken] = useContext(AccessToken);
	const init_base = useContext(RequestInitDELETE);
	function del(){
		if (!b || !taken || !center_data || center_data === 'CREATE_CHANNEL')
			return ;
		const init: RequestInit = {
			...init_base,
		};
		set_b(_=>false);
		fetch(`/backend/channel/${center_data.id}`, init).then(_=>{
			set_b(_=>true);
			set_center_data(_=>null);
		});
	}

	return (<>
		{center_data==='CREATE_CHANNEL' ?<>
			<div className={Style.click_part}>
				<div className={Style.info}>
					<h1 className={Style.font}>Create Channel</h1>
					<div>
						<CreateChannel set={set} />
					</div>
					<span className={`bx bx-x ${Style.icon_info}`} onClick={_=>set_center_data(_=>null)}></span>
					{/* <i class='bx bxs-message-rounded-add'></i> */}
				</div>
			</div>
			</>: center_data ?<>
	 		<div className={Style.click_part}>
	 			<div className={Style.info}>
	 				<h1 className={Style.group_name2}>{center_data.name}</h1>
	 				<span className={`bx bx-x ${Style.icon_info}`} onClick={_=>set_center_data(_=>null)}></span>
	 			</div>
				 <div >
	 				<button className={Style.delete_button} onClick={del}>{(center_data.authority==='OWNER')?(b?'delete':'deleting'):(b?'leave':'leaving')}</button>
	 				<Link className={Style.chat} href={`chat/channel/${center_data.id}`}>chat</Link>
				</div>
	 		</div>
		</>:<></>}
	</>);
}



