import { DmList } from "@/components/chat/DmList";
import { SendeDm } from "@/components/chat/SendeDm";
import { AccessToken, QueryOfAccessToken, RequestInit, MyInfo } from "@/pages/_app";
import { DMEvent, FriendData, Message } from "@/lib/types";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import dm_styles from '../../../styles/Dm_design.module.css';
import Home_style from '../../../styles/Home_design.module.css';
import { Sidebar } from "@/components/Sidebar";


export default function Dm() {
	const router = useRouter();
	const [taken] = useContext(AccessToken);
	const init = useContext(RequestInit);
	const query = useContext(QueryOfAccessToken);
	const [messages, set_messages] = useState([] as Message[]);
	const [target, set_target] = useState({} as FriendData);
	const id = router.query.id;
	useEffect(()=>{
		if (!taken){
			router.push('/');
		}
		return ()=>{};
	},[taken]);
	useEffect(()=>{
		if (typeof id === 'string' && taken)
		{
			//チャットデータの取得
			fetch(`/backend/chat/dm/${id}`, init).then(v=>{
				if (Math.floor( v.status / 100) !== 2)
					throw 'error';
				return (v.json());
			}).then((v:Message[])=>{
				set_messages(_=>v);
			}).catch(_=>router.replace('/404', router.asPath));
			//対象のデータの取得
			fetch(`/backend/friend/${id}`, init).then(v=>{
				if (Math.floor( v.status / 100) !== 2)
					throw 'error';
				return (v.json());
			}).then((v:FriendData)=>{
				set_target(_=>v);
			}).catch(_=>router.replace('/404', router.asPath));
			//コネクションを確立
			const event_source = new EventSource(`/backend/chat/dm/event/${id}?` + query.toString());
			event_source.onmessage = ({data}:{data:string})=>{
				const {data_type, content} = JSON.parse(data) as DMEvent;
				switch (data_type) {
					case 'MESSAGE':
						set_messages(old=>[...old, content]);
						break;
				
					default:
						break;
				}
			}
			return ()=>event_source.close();
		} else if (typeof id !== 'undefined'){
			router.replace('/404', router.asPath);
		}
		return ()=>{};
	},[taken, id]);
		return (
		<>
			<Head>
				<title>transcendence:chat</title>
				<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
			</Head>
			<main>
				<div className={Home_style.jwt_ture}>
					<aside className={Home_style.side_bar}>
						<Sidebar />
					</aside>
					<div className={dm_styles.chat_container}>
						<div className={dm_styles.chat_box}>
							<h1 className={dm_styles.target_name}>{target.nickname || target.name}</h1>
							<DmList msgs={messages} target={target}/>
							{typeof id === 'string' ? <SendeDm chat_id={id} set={set_messages} /> : ''}
						</div>
					</div>
					
				</div>
			</main>
		</>
	);
}
