import { UserAtChannel } from "@/lib/types";
import { MemberLine } from "./MemberLine";
import Styles from '../../styles/Dm_design.module.css';
import { Dispatch, SetStateAction, useContext } from "react";
import { MyInfo } from "@/pages/_app";
import { ChatChannelCenter } from "@/pages/chat/channel/[id]";
import Home_style from '../../styles/Home_design.module.css';


export function MemberList({users,set_center}:{users:Map<number,UserAtChannel>,set_center:Dispatch<SetStateAction<ChatChannelCenter>>}){
	const user_arr_on:UserAtChannel[] = [];
	const user_arr_off:UserAtChannel[] = [];
	const [me] = useContext(MyInfo);

	users.forEach(v=>{
		if (me.id === v.id){
			return ;
		}
		if (v.status.length)
			user_arr_on.push(v);
		else
			user_arr_off.push(v)
	});
	return(<>
		<div className={Home_style.friend_list}>
			<p className={Styles.member_font}>groups Member</p>
			{[...user_arr_on,...user_arr_off].map(v=><MemberLine key={v.id} user={v} set_center={set_center} />)}
		</div>

	</>);
}