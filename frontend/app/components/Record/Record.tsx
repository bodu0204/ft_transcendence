import Link from "next/link";
import styles from '../../styles/Home_design.module.css';
import { useContext, useEffect, useState } from "react";
import { AccessToken, RequestInit } from '../../pages/_app';
import { FriendData, GameResult } from "@/lib/types";

// 自分の情報
export function Record({target}: {target: FriendData}){
	const [token] = useContext(AccessToken);
	const init = useContext(RequestInit);
	const [results, setResults] = useState([] as GameResult[])

	useEffect(()=>{
		if (!token) {
			return ()=>{};
		}
		fetch('/backend/friend/result', init).then(v => v.json()).then((v: GameResult[]) => {
			const result = [] as GameResult[]
			v.forEach((v) => {
				result.push(v)
			});
			setResults(result)
		})
	}, [token]);

	return(<>
		{results.map(v => (
			<div key={v.id} className={styles.Boxs}>
				<img className={styles.vs_img1} src={target.avatar} alt="Game image"></img>
				<img className={styles.vs_img2} src={v.opponentAvatar} alt="Game image"></img>
				<h1 className={styles.vs_font}>-</h1>
				<h2 className={styles.score1}>{v.myScore}</h2>
				<h2 className={styles.score2}>{v.opponentScore}</h2>
			</div>
		))
		}
	</>);
}