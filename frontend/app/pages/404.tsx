import Head from "next/head";
import Link from "next/link";
import Styles from '../styles/Game.module.css';


export default function NotFound() {
	return (
		<>
			<Head>
				<title>transcendence:not-found</title>
			</Head>
			<main>
				<div className={Styles.background_error}>
					<div className={Styles.cat}>
						<h1 className={Styles.error_404}>404 Error</h1>
						<Link href="/">Home</Link><br />
					</div>
				</div>
			</main>
		</>
	)
}
