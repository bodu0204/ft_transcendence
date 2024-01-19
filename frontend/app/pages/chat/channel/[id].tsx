import { ChannelBaseInfo, ChannelOfUser, ChatEvent, Message, UserAtChannel } from "@/lib/types";
import { AccessToken, MyInfo, QueryOfAccessToken, RequestInit } from "@/pages/_app";
import Head from "next/head";
import { useRouter } from "next/router";
import { createContext, useContext, useEffect, useState } from "react";
import dm_styles from '../../../styles/Dm_design.module.css';
import Home_style from '../../../styles/Home_design.module.css';

import { Sidebar } from "@/components/Sidebar";
import { ChatCenter } from "@/components/chat/ChatCenter";
import { MessageList } from "@/components/chat/MessageList";
import { SendMessage } from "@/components/chat/SendMessage";
import { MemberList } from "@/components/chat/MemberList";

export type ChatChannelCenter = {
	datatype:'NEED_PASS';
	content?:undefined;
} | {
	datatype:'INVITE';
	content?:undefined;
} | {
	datatype:'MEMBER_CONTROLE';
	content:UserAtChannel;
} | {
	datatype:'HUNGIUP';
	content:string
} | {
	datatype:'CHANNEL_CONTROLE';
	content?:undefined;
} | {
	datatype:'NOTHING';
	content?:undefined;
};


export const PasswordQuery = createContext([null,new URLSearchParams()] as [string|null,URLSearchParams]);

export default function Channel() {
	const router = useRouter();
	const [taken] = useContext(AccessToken);
	const init = useContext(RequestInit);
	const query = useContext(QueryOfAccessToken);
	const [messages, set_messages] = useState(new Map<number, Message>());
	const [users, set_users] = useState(new Map<number, UserAtChannel>());
	const [channel, set_channel] = useState({} as ChannelOfUser);
	const [correct, set_correct] = useState(false);
	const [password, set_password] = useState(null as null|string);
	const id = router.query.id;
	const url_params = new URLSearchParams();
	if (typeof password === 'string')
		url_params.append('password', password);
	const [me] = useContext(MyInfo);
	const [center, set_center] = useState({datatype:'NOTHING'} as ChatChannelCenter);
	const mutedUntil = users.get(me.id)?.mutedUntil;
	useEffect(()=>{
		if (!taken){
			router.push('/');
		}
		return ()=>{};
	},[taken]);
	useEffect(()=>{
		if (typeof id === 'string' && taken)
		{
			if (!correct){
				//基本情報取得
				fetch(`/backend/channel/${id}` + ((password)?('?' + url_params.toString()):''), init).then(v=>{
					if (Math.floor( v.status / 100) !== 2)
						throw 'error';
					return (v.json());
				}).then(({channel,users}:ChannelBaseInfo)=>{
					set_channel(_=>channel);
					if (channel.access === 'PROTECTED' && !users){
						set_center(_=>({datatype:'NEED_PASS'}));
					}
					if (users){
						set_correct(_=>true);
						if (center.datatype === 'NEED_PASS'){
							set_center(_=>({datatype:'NOTHING'}));
						}
						set_users(old=>{
							users.forEach(v=>old.set(v.id, v));
							return new Map(old);
						});
						//チャットデータの取得
						fetch(`/backend/chat/channel/${id}` + ((password)?('?' + url_params.toString()):''), init).then(v=>{
							if (Math.floor( v.status / 100) !== 2){
							throw 'error';
							}
							return (v.json());
						}).then((v:Message[])=>{
							set_messages(old=>{
								v.forEach(vv=>old.set(vv.id, vv));
								return (new Map(old))
							});
						}).catch(_=>{router.replace('/404', router.asPath);});
					}
					return ()=>{}
				}).catch(_=>{router.replace('/404', router.asPath)});
			}else{
				//コネクションを確立
				if (password)
					query.append('password', password)
				const event_source = new EventSource(`/backend/chat/channel/event/${id}?` + query.toString());
				event_source.onmessage = ({data}:{data:string})=>{
					const {data_type, content}:ChatEvent = JSON.parse(data)
					switch (data_type) {
						case 'KICK':
							set_center(_=>({datatype:'HUNGIUP', content:content.message}))
							return;
						case 'MESSAGE':
							set_messages(old=>{
								old.set(content.id, content);
								return new Map(old);
							});
							return;
						case 'USER':
							set_users(old=>{
								old.set(content.id, content);
								return new Map(old);
							});
							if (me.id === content.id)
								set_channel(old=>({...old, authority:content.authority==='MUTED'?'MEMBER':content.authority}))
							return;
						case "STATUS":
							if (users.has(content.id)){
								set_users(old=>{
									const data = old.get(content.id);
									if (data){
										data.status = content.status;
									}
									return new Map(old);
								});																
							}						
							break;
					}
				};
				return ()=>event_source.close();
			}
		}
		return ()=>{};
	},[taken, id, password, correct]);
	function set_invite(){
		set_center(v=>{
			const {datatype} = v;
			if (datatype === 'NEED_PASS' || datatype === 'HUNGIUP')
				return v;
			else
				return {datatype:'INVITE'}
		});
		return ;
	}
	function set_CH_controle(){
		set_center(v=>{
			const {datatype} = v;
			if (datatype === 'NEED_PASS' || datatype === 'HUNGIUP')
				return v;
			else
				return {datatype:'CHANNEL_CONTROLE'}
		});
		return ;
	}

	return (
		<PasswordQuery.Provider value={[password, url_params]}>
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
							<div className={dm_styles.decoration}>
								<p className={dm_styles.channel_name}> {channel.name} </p>
								{channel.access === 'PRIVATE' && <span className={`bx bxs-user-plus ${dm_styles.icon_info}`} onClick={set_invite}></span>}
								{channel.authority==='OWNER' && <span className={`bx bxs-cog ${dm_styles.icon_info}`} onClick={set_CH_controle}></span>}
							</div>
							<MessageList messages={messages} users={users} />
							{(!mutedUntil || (new Date(mutedUntil) < new Date(Date.now())))? <SendMessage channel_id={channel.id}/>:<p className={dm_styles.mute_font}>---- You are muted ----</p>}				
						</div>
					</div>
					{/* メンバー一覧 */}
					<MemberList users={users} set_center={set_center} />
					<ChatCenter senter_data={center} set_senter_data={set_center} set_pass={set_password} channel={channel} users={users}/>
				</div>
			</main>
		</PasswordQuery.Provider>
	)
}
