import { WebSocket } from '@/components/socket/WebSocket';
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { createContext, useState, useEffect, Dispatch, SetStateAction } from 'react'
import { FriendData } from "@/lib/types";
const default_my_data = {id: -1,name: 'No-name',nickname: '',level: 0,avatar: '/2.jpg',email: 'nothing@nothing',status: [],type: 'FRIEND',};

export const AccessToken = createContext(['', ()=>{}]as [string, Dispatch<SetStateAction<string>>]);
export const MyInfo = createContext([default_my_data, ()=>{}] as [FriendData, Dispatch<SetStateAction<FriendData>>]);
export const RequestInit = createContext({});
export const RequestInitPUT = createContext({});
export const RequestInitPOST = createContext({});
export const RequestInitDELETE = createContext({});
export const RequestInitFileUploade = createContext({});
export const QueryOfAccessToken = createContext(new URLSearchParams());
export const Websocket = createContext(new WebSocket());


export default function App({ Component, pageProps }: AppProps) {
	const [jwt, set_jwt] = useState('');
	const [me, set_me] = useState(default_my_data as FriendData);
	const [socket, set_socket] = useState(new WebSocket());
	const request_init :RequestInit=jwt ? {
		method: "GET",
		headers: {
			Authorization: "Bearer " + jwt,
		},
	}:{};
	const request_init_put :RequestInit=jwt ? {
		method: "PUT",
		headers: {
			Authorization: "Bearer " + jwt,
			'Content-Type': 'application/x-www-form-urlencoded', 
		},
	}:{};
	const request_init_post :RequestInit=jwt ? {
		method: "POST",
		headers: {
			Authorization: "Bearer " + jwt,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	}:{};
	const request_init_delete :RequestInit=jwt ? {
		method: "DELETE",
		headers: {
			Authorization: "Bearer " + jwt,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	}:{};
	const request_init_file :RequestInit=jwt ? {
		method: "PUT",
		headers: {
			Authorization: "Bearer " + jwt,
		},
	}:{};
	const url_params = new URLSearchParams();
	url_params.append('access_token', jwt);
	useEffect(()=>{
		if (!jwt){
			return socket.delfunc;
		}
		//自分のデータの取得
		fetch(`/backend/me`, request_init).then(v=>{
			if (Math.floor( v.status / 100) !== 2)
				throw 'error';
			return (v.json());
		}).then((v:FriendData)=>{
			set_me(_=>v);
		});
		//WebSocket接続の確立
		const new_socket = new WebSocket(new URL(window.location.href));
		set_socket(old=>{
			old.del();
			return new_socket;
		});
		return new_socket.delfunc;
	},[jwt]);
	return (
		<AccessToken.Provider value={[jwt, set_jwt]}>
		<MyInfo.Provider value={[me,set_me]}>
		<RequestInit.Provider value={request_init}>
		<RequestInitPUT.Provider value={request_init_put}>
		<RequestInitPOST.Provider value={request_init_post}>
		<RequestInitDELETE.Provider value={request_init_delete}>
		<RequestInitFileUploade.Provider value={request_init_file}>
		<QueryOfAccessToken.Provider value={url_params}>
		<Websocket.Provider value={socket}>
			<Component {...pageProps} />
		</Websocket.Provider>
		</QueryOfAccessToken.Provider>
		</RequestInitFileUploade.Provider>
		</RequestInitDELETE.Provider>
		</RequestInitPOST.Provider>
		</RequestInitPUT.Provider>
		</RequestInit.Provider>
		</MyInfo.Provider>
		</AccessToken.Provider>
	);
}
