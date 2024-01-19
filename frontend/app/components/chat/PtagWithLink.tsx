import Link from "next/link";
import Styles from '../../styles/Dm_design.module.css';

export function PtagWithLink({str}:{str:string}){
	const r_url = /https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+/g;
	const normal_strs = str.split(r_url);
	const link_strs = str.match(r_url)?.map((v)=><Link href={v}>{v}</Link>) || [];
	return (
		<p className={Styles.message}>
			{normal_strs.map((v,i)=><span key={i}>{v}{i<link_strs.length && link_strs[i]}</span>)}
		</p>
	);
}