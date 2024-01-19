import { FriendData, Message } from "@/lib/types";
import { MyInfo } from "@/pages/_app";
import { useContext } from "react";
import Styles from '../../styles/Dm_design.module.css';
import { PtagWithLink } from "./PtagWithLink";

export function DmLine({msg, target}:{msg:Message, target:FriendData}){
	const [me] = useContext(MyInfo);
	return (msg.userId === me.id ?
		<div className={Styles.position2}>
			{/* 自分のメッセージ */}
			<div className={Styles.my_message}>
				<PtagWithLink str={msg.context} />
			</div>
		</div>
	:
		<div className={Styles.position1}>
			{/* 相手のメッセージ */}
			<img className={Styles.target_img} src={target.avatar} alt="dm image"></img>
			<div className={Styles.target_message}>
				<PtagWithLink str={msg.context} />
			</div>
		</div>
	);
}