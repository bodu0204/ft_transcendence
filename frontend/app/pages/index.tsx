import Head from 'next/head'
import { Login } from '@/components/login/Login';
import { useContext, useEffect } from 'react';
import { AccessToken, QueryOfAccessToken } from './_app';
import styles from '../styles/Home_design.module.css';
import { Friend } from '@/components/friend/Friend';
import { HomeInfo } from '@/components/HomeInfo';
import { Sidebar } from '@/components/Sidebar';

type HomeProps = {
	access_token:string
	redirect42:string
}

export default function Home() {
	const [token] = useContext(AccessToken);
	const query = useContext(QueryOfAccessToken);
	useEffect(()=>{
		if (!token){
			return ()=>{};
		}
		const event_source = new EventSource('/backend/event?' + query.toString());
		event_source.onmessage = ({data})=>console.log(data);
		return (()=>{event_source.close()});  
	},[token]);
	
	return (
		<>
			<Head>
				<title>transcendence</title>
				<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
			</Head>
	
			<main>
				<div className={styles.home_page}>
					<Login />
						<div className={token ? styles.jwt_ture :  styles.jwt}>
							<aside className={styles.side_bar}>
								<Sidebar />
							</aside>
							<div className={styles.Home_Info}>
								<HomeInfo />
							</div>
							<div className={styles.friend_list}>
								<Friend status="HOME"/>
							</div>
						</div>
				</div>
			</main>
		</>
	)
}