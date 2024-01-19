import { ChannelOfUser, FriendData,UserDisp } from '@/lib/types';
import Head from 'next/head'
import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import Home_style from '../styles/Home_design.module.css';
import Friend_style from '../styles/Friend.module.css';
import { Sidebar } from '@/components/Sidebar';
import { Friend } from '@/components/friend/Friend';
import { SerchFriend } from '@/components/friend/SerchFriend';
import { Channel } from '@/components/channel/Channel';
import { SerchChannel } from '@/components/channel/SerchChannel';
import { AccessToken } from './_app';
import { useRouter } from 'next/router';


export default function UserPage() {
	const [status, set_status] = useState('FRIEND' as UserDisp);
	const [friends, set_friends] = useState(new Map<number, FriendData>());
	const [center_data_friend, set_center_data_friend] = useState(null as null | FriendData);
	const [center_data_channel, set_center_data_channel] = useState(null as null | "CREATE_CHANNEL" | ChannelOfUser);
	const [channels, set_channels] = useState(new Map<number, ChannelOfUser>());
	const [token] = useContext(AccessToken);
	const router = useRouter();

	useEffect(()=>{
		if (!token){
			router.push('/');
		}
		return ()=>{};
	},[token]);

return (
		<>
			<Head>
				<title>transcendence:friends</title>
				<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
			</Head>
			<main>
			<div className={Home_style.jwt_ture}>
				<aside className={Home_style.side_bar}>
					<Sidebar />
				</aside>

				<div className={Friend_style.friend_page}>
					<div className={Friend_style.friend_box}>
						<input className={Friend_style.button} type="submit" name="submit" value="Friends" onClick={_=>{set_status(_=>'FRIEND');set_center_data_friend(_=>null);set_center_data_channel(_=>null)}}></input>
						<input className={Friend_style.button} type="submit" name="submit" value="Group" onClick={_=>{set_status(_=>'CHANNEL');set_center_data_friend(_=>null);set_center_data_channel(_=>null)}}></input>
						<input className={Friend_style.button} type="submit" name="submit" value="Blocked" onClick={_=>{set_status(_=>'BLOCK');set_center_data_friend(_=>null);set_center_data_channel(_=>null)}}></input>
						<input className={Friend_style.button} type="submit" name="submit" value="New Friend?" onClick={_=>{set_status(_=>'ADD');set_center_data_friend(_=>null);set_center_data_channel(_=>null)}}></input>
					</div>
					<div className={Friend_style.box}>
						{status==='FRIEND' || status==='ADD' || status==='BLOCK' ?<>

							<Friend status={status} friends_data={[friends, set_friends]} center={[center_data_friend, set_center_data_friend]} />
					
						</>: status==='CHANNEL'?<>
							<Channel center={[center_data_channel, set_center_data_channel]} channel_data={[channels, set_channels]} />
						</>:<></>}
					</div>
				</div>

				{/* ========= Search Part ========== */}
			
				{status==='FRIEND' || status==='ADD' || status==='BLOCK' ?<>
					<SerchFriend friend_data={friends} center={[center_data_friend,set_center_data_friend]} />
				</>: status==='CHANNEL'?<>
				
				{/* ========= チャンネルの検索 をここに書く ========== */}
					<SerchChannel channel_data={channels} set_center_data={set_center_data_channel} />
				</>:<></>}
			</div>
			</main>
		</>
	)
}
