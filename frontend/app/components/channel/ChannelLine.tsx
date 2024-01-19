import { ChannelOfUser } from "@/lib/types";
import Style from '../../styles/Friend.module.css';
import { Dispatch, SetStateAction } from "react";

export function ChannelLine({channel, set_center}:{channel:ChannelOfUser, set_center:Dispatch<SetStateAction< null | "CREATE_CHANNEL" | ChannelOfUser>>}){

	return (
		<div className={Style.groups} onClick={_=>{set_center(_=>channel);}}>
			<img className={Style.group_img} src="/4.jpg" alt="Game image"></img>
			<h1 className={Style.group_name}>{channel.name}   <p className={Style.acces_styles}>{channel.access}</p></h1> 
		</div>
	);
}