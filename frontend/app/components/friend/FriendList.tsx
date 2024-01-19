import { FriendData, FriendDisp } from "@/lib/types";
import Home_style from '../../styles/Home_design.module.css';
import Friend_style from '../../styles/Friend.module.css';

export function FriendList({status, data, set_center_data}:{status:FriendDisp, data:FriendData[], set_center_data:Function}){
	let styles:{
		readonly [key: string]: string;
	} = Friend_style;
	if (status === 'HOME'){
		styles = Home_style;
	}
	return(<>
			{data.map(v=>(
			<div key={v.id} className={`${styles.friends} ${v.status.length ? "" : styles.friends_offline}`} onClick={()=>{if(!set_center_data){return ;} set_center_data((_:any)=>v);}}>
				<img className={styles.friend_img} src={v.avatar} alt="Game image"></img>
				<h1 className={styles.name}>{v.nickname || v.name}</h1>
				{status === 'HOME' ? (<h2 className={styles.online}>{v.status.length ? (v.status.findIndex(v=>v==='GAME') >= 0 ? 'game': 'online') : 'offline'}</h2>) : <></>}
			</div>))}
	</>);
}