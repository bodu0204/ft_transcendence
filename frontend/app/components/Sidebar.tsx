import styles from '../styles/Home_design.module.css';
import Link from 'next/link';
import { AccessToken } from "@/pages/_app";
import { useContext } from 'react';

export const Sidebar = () => {
	const [jwt, set_jwt] = useContext(AccessToken);

	function logout() {
		set_jwt(()=>'')
	}

	return (
			<div className={styles.icons}>
				<span className={`bx bxs-home-alt-2 ${styles.icon_info}`}><Link href="/" className={styles.link}>Home</Link></span>
				<span className={`bx bxs-user ${styles.icon_info}`}><Link href="/friends" className={styles.link}>Friends</Link></span>
				<span className={`bx bxs-game ${styles.icon_info}`}><Link href="/game" className={styles.link}>Game</Link></span>
				<span className={`bx bxs-cog ${styles.icon_info}`}><Link href="/setting" className={styles.link}>Setting</Link></span>
				<span className={`bx bxs-log-out ${styles.icon_info}`}><Link href="/" onClick={logout} className={styles.link}>Logout</Link></span>
			</div>
	);
};