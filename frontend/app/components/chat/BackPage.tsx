import Link from "next/link";
import Friend_style from '../../styles/Friend.module.css';
import Dm_styles from '../../styles/Dm_design.module.css';

export function BackPage({message}:{message:string}){
	return (
		<div className={Friend_style.click_part}>
			<div className={Friend_style.info}>
				<div className={Dm_styles.error_page}>
					<h1>{message}</h1>
					<Link href="/" className={Dm_styles.link}>Back Home</Link>
				</div>
			</div>
		</div>
	);
}