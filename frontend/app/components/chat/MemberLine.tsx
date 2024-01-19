import { UserAtChannel } from "@/lib/types";
import Styles from '../../styles/Dm_design.module.css';
import { Dispatch, SetStateAction, useContext } from "react";
import { ChatChannelCenter } from "@/pages/chat/channel/[id]";
import Home_style from '../../styles/Home_design.module.css';


export function MemberLine({user, set_center}:{user:UserAtChannel,set_center:Dispatch<SetStateAction<ChatChannelCenter>>}){
	function set_member_cotrole(){
		set_center(v=>{
			const {datatype} = v;
			if (datatype === 'NEED_PASS' || datatype === 'HUNGIUP')
				return v;
			else
				return {datatype:'MEMBER_CONTROLE',content:user}
		});
		return ;
	}
	return(
		<div className={Home_style.friends} onClick={set_member_cotrole}>
			<img className={Home_style.friend_img} src={user.avatar} alt="Game image"></img>
			<h1 className={Home_style.name}>{user.nickname || user.name}</h1>

			<div className={Styles.crown}>
				{/* 金の王冠 */}
				{/* <span className={`bx bxs-crown ${Styles.gold}`}></span> */}
				{/* 銀の王冠 */}
				{/* <span className={`bx bxs-crown ${Styles.silver}`}></span> */}
				{/* 普通の王冠 */}
				{/* <span className={`bx bxs-crown ${Styles.regular}`}></span> */}
			</div>

			{/* ブロックのアイコン */}
			{/* <span className={`bx bx-block ${Styles.block_icon}`}></span> */}

			{/* ミュートのアイコン */}
			{/* <span className={`bx bxs-volume-mute ${Styles.mute_icon}`}></span> */}
		</div>
	);
}