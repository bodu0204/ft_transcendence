import { FriendData, FriendEvent, FriendDisp } from '@/lib/types';
import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { AccessToken, QueryOfAccessToken, RequestInit } from '../../pages/_app';
import { update_followd_friend_type } from '@/lib/update_friend_type';
import { FriendList } from '@/components/friend/FriendList';
import { FriendInfo } from './FriendInfo';

type args = {
	status:FriendDisp;
	friends_data?:[Map<number, FriendData>, Dispatch<SetStateAction<Map<number, FriendData>>>];
	center?:[null|FriendData,Dispatch<SetStateAction<null|FriendData>>];
}

export function Friend({status, friends_data, center}:args){	
	const [friends, set_friends] = friends_data || useState(new Map<number, FriendData>());
	const [center_data, set_center_data] = center || useState(null as null | FriendData);
	const [taken] = useContext(AccessToken);
	const init = useContext(RequestInit);
	const query = useContext(QueryOfAccessToken);
	const [, set_reload] = useState(0);
	const friend_list:FriendData[] = [];
	const followed_list:FriendData[] = [];
	const following_list:FriendData[] = [];
	const blocking_list:FriendData[] = [];

	useEffect(()=>{
		if (!taken) {
			return ()=>{};
		}
		fetch('/backend/friend',init).then(v=>v.json()).then((v:FriendData[])=>{
			set_friends((_)=>{
				const ret = new Map<number, FriendData>();
				v.forEach((v)=>{
					ret.set(v.id, v);
				});
				return ret;
			});
		});
		const event_source = new EventSource('/backend/friend/event?' + query.toString());
		event_source.onmessage = ({data}:{data:string})=>{
			const followere:FriendEvent = JSON.parse(data);
			const {data_type,content} = followere;
			switch (data_type) {
				case "STATUS":
					set_friends(old=>{
						const data = old.get(content.id);
						if (data){
							data.status = content.status;
							set_reload(v=>v + 1);
						}
						return new Map(old);
					});																
					break;
				case "FOLLOW":
					set_friends(old=>{
						old.set(content.id, {...content, type:update_followd_friend_type(old.get(content.id)?.type)});
						return new Map(old);
					});								
					break;
			}
		}
		return (()=>{event_source.close()});
	},[taken]);

	friends.forEach((v)=>{
		switch (v.type) {
			case "FRIEND":
				friend_list.push(v);				
				break;
			case "FOLLOWED":
				followed_list.push(v);				
				break;
			case "FOLLOWING":
				following_list.push(v);				
				break;
			case "BLOCKING":
				blocking_list.push(v);				
				break;		
			default:
				break;
		}
	});


	return (<>
		{center_data && 
			<FriendInfo key={center_data.id} data={center_data} friends={friends} set_center={set_center_data} set_friend_list={set_friends} />
		}
		{
		status==='FRIEND'?
			<FriendList status="FRIEND" data={friend_list} set_center_data={set_center_data} />
		:status==='ADD'?
			<FriendList status="ADD" data={followed_list} set_center_data={set_center_data} />
		:status==='BLOCK'?
			<FriendList status="BLOCK" data={blocking_list} set_center_data={set_center_data} />
		://status==='HOME'?
			<FriendList status="HOME" data={friend_list} set_center_data={set_center_data} />
		}
	</>);
}