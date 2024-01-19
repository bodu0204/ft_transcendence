import { FriendData, Message } from "@/lib/types";
import { DmLine } from "./DmLine";
import Styles from '../../styles/Dm_design.module.css';


export function DmList({msgs,target}:{msgs:Message[], target:FriendData}) {
	return (<>
	<div className={Styles.positions}>
		{msgs.map((v)=><DmLine key={v.id} msg={v} target={target}/>)}
	</div>
	</>);
}