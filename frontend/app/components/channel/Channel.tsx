import { ChannelEvent, ChannelOfUser } from "@/lib/types";
import { AccessToken, QueryOfAccessToken, RequestInit } from "@/pages/_app";
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import Style from '../../styles/Friend.module.css';
import { ChannelCenter } from "./ChannelCenter";
import { ChannelLine } from "./ChannelLine";

type args = {
	center:[ null | "CREATE_CHANNEL" | ChannelOfUser, Dispatch<SetStateAction< null | "CREATE_CHANNEL" | ChannelOfUser>>];
	channel_data:[Map<number, ChannelOfUser>, Dispatch<SetStateAction<Map<number, ChannelOfUser>>>]
}

export function Channel({center, channel_data}:args){	
	const [channels, set_channels] = channel_data
	const [taken] = useContext(AccessToken);
	const init = useContext(RequestInit);
	const query = useContext(QueryOfAccessToken);
	const [, set_center_data] = center;
	const channel :ChannelOfUser[]= []

	channels.forEach(v=>channel.push(v));
	useEffect(()=>{
		if (!taken){
			return ()=>{};
		}
		fetch('/backend/channel/',init).then(v=>v.json()).then((v:ChannelOfUser[])=>{
			set_channels(_=>{
				const ret = new Map<number, ChannelOfUser>();
				v.forEach((v)=>{
					ret.set(v.id, v);
				});
				return ret;
			});
		});
		const event_source = new EventSource('/backend/channel/event?' + query.toString());
		event_source.onmessage = ({data}:{data:string})=>{
			const {data_type, content}:ChannelEvent = JSON.parse(data);
			set_channels(old=>{
				switch (data_type) {
					case 'NEW':
						old.set(content.id, content);
						break;
					case 'DEL':
						old.delete(content.id);
						break;
					case 'ACCESS':
						const buf = old.get(content.id);
						if (buf){
							buf.access = content.access
						}
						break;
				}
				return new Map(old);
			});
		}
		return (()=>{event_source.close()});   
	},[taken]);
	return (<>
		<ChannelCenter center={center} set={set_channels} />
		<div className={Style.group}>
			<div className={Style.your_groups}>
				<div className={Style.position}>
					<h1 className={Style.font}>Your Groups<button className={Style.click} onClick={_=>set_center_data(v=>'CREATE_CHANNEL')}>New Channel</button></h1>
				</div>
			{channel.map(v=><ChannelLine key={v.id} channel={v} set_center={set_center_data}/>)}
			</div>
		</div>
	</>);

}