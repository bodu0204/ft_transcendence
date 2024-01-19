import { useContext, useEffect, useState } from 'react';
import styles from '../../styles/Home_design.module.css';
import { FriendData, GameResult } from "@/lib/types";
import { AccessToken, RequestInit } from '@/pages/_app';

export function Profile({target}:{target:FriendData}){
	const [token] = useContext(AccessToken);
	const init = useContext(RequestInit)
	const [winrate, setWinrate] = useState<number>(100)

	useEffect(()=>{
		if (!token) {
			return ()=>{};
		}
		fetch('/backend/friend/winrate', init).then(v => v.json()).then((v: number) => {
			setWinrate(v)
		})
	}, [token]);
	//winrate
	return(<>
		<div>
			<img className={styles.profile_img} src={target.avatar} alt="Profile Image"></img>
		</div>

		<div className={styles.profile_position}>
			<h3 className={styles.profile_name}>{target.nickname || target.name}</h3>
			{target.nickname && <p className={styles.nick_name}>{target.name}</p>}
			<h2 className={styles.Win_rate}>{winrate + '%'}</h2>

			<h1 className={styles.skill_font}>----- Your Lv {Math.floor(target.level)} -----</h1>
			<div className={styles.skill_position}>
				<div className={styles.skill_bar}>
					<div className={styles.skill_bar_fill} style={{ width: Math.floor(target.level * 100) % 100 + '%'}}></div>
				</div>
			</div>
		</div>
	</>);
}