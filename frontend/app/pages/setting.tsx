import Head from 'next/head';
import Styles from '../styles/Home_design.module.css';
import { AvatarUploade } from '@/components/AvatarUploade';
import { Sidebar } from '@/components/Sidebar';
import { useContext, useEffect, useState } from 'react';
import { AccessToken, MyInfo } from './_app';
import { SettingName } from '@/components/setting/SettingName';
import { SettingPass } from '@/components/setting/SettingPass';
import { SettingTwoFactor } from '@/components/setting/SettingTwoFactor';
import { useRouter } from 'next/router';
//	const me = useContext(MyInfo);



const Setting = () => {
	const [me] = useContext(MyInfo);
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
			<title>transcendence:setting</title>
					<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
		</Head>
		<main>
			<div className={Styles.jwt_ture}>
				<aside className={Styles.side_bar}>
					<Sidebar />
				</aside>
				<div className={Styles.profile_setting}>
					<h1 className={Styles.font}>Settings</h1>
					<div className={Styles.font}>You can change your Profile
						<p className={`bx bx-edit-alt ${Styles.icon}`}></p>
					</div>
					<p className={Styles.font}>Profile Photo:</p>
					<img className={Styles.edit_img} src={me.avatar} alt="Profile Image"></img>
					<div className={Styles.avatar_position}>
						<AvatarUploade /> 
					</div>
					<SettingName />
					<SettingPass />
					<SettingTwoFactor />
				</div>
			</div>
		</main>
	</>
  );
};

export default Setting;