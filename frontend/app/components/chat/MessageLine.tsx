import { Message, UserAtChannel } from "@/lib/types";
import { MyInfo } from "@/pages/_app";
import { useContext } from "react";
import Styles from '../../styles/Dm_design.module.css';
import { PtagWithLink } from "./PtagWithLink";

export function MessageLine({message, user}:{message:Message, user:UserAtChannel}){
	const[me] = useContext(MyInfo);
	return(user.id !== me.id ?
			<div className={Styles.position1}>
				<img className={Styles.target_img} src={user.avatar} alt="dm image"></img>
				<div className={Styles.target_message}>
					<PtagWithLink str={message.context} />
				</div>
			</div>
		:
			<div className={Styles.position2}>
				<div className={Styles.my_message}>
					<PtagWithLink str={message.context} />
				</div>
			</div>
	);
}