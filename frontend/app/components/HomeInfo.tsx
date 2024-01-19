import { Profile } from '@/components/Profile/Profile';
import styles from '../styles/Home_design.module.css';
import { Record } from './Record/Record';
import { useContext, useEffect } from 'react';
import { AccessToken, MyInfo, RequestInit } from '../pages/_app';
import { FriendData } from '@/lib/types';

// 優勝した成績
export function HomeInfo (){
	const [me, set_me] = useContext(MyInfo);
	const [taken] = useContext(AccessToken);
	const init = useContext(RequestInit);
	
	useEffect(()=>{
		if (!taken){
			return ()=>{};
		}
		//自分のデータの取得
		fetch(`/backend/me`, init).then(v=>{
			if (Math.floor( v.status / 100) !== 2)
				throw 'error';
			return (v.json());
		}).then((v:FriendData)=>{
			set_me(_=>v);
		});
		return ()=>{};
	},[taken]);

	return(<>
		<div className={styles.profile_info}>
			<Profile target={me}/>
		</div>

		<div className={styles.play_total}>
			<Record target={me}/>
		</div>
	</>);
}