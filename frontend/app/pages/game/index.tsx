import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect, useState, ChangeEvent } from "react";
import Home_style from '../../styles/Home_design.module.css';
import Game_style from '../../styles/Game.module.css';
import Friend_style from '../../styles/Friend.module.css';
import { Sidebar } from "@/components/Sidebar";
import { FriendData } from "@/lib/types";
import { AccessToken, QueryOfAccessToken, RequestInit, Websocket } from "../_app";


export default function Game() {
	const [isEntry, setIsEntry] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [me, setMe] = useState({} as FriendData);
	const [ballSpeed, setBallSpeed] = useState(3);
	const [paddleSpeed, setPaddleSpeed] = useState(3);
	const [maxScore, setMaxScore] = useState(10);
	const [opponent, setOpponent] = useState<number | null>(null);
	const [friends, setFriends] = useState([] as FriendData[]);
	const router = useRouter();
	const socket = useContext(Websocket).socket
	const init = useContext(RequestInit);
	const [token] = useContext(AccessToken);
	const query = useContext(QueryOfAccessToken);

	useEffect(()=>{
		if (!token){
			router.push('/');
		}
		return ()=>{};
	},[token]);

	useEffect(() => {
		if (!token){
			return ()=>{};
		}
		fetch(`/backend/me`, init).then(v => {
			if (Math.floor(v.status / 100) !== 2)
				throw 'error';
			return (v.json());
		}).then((v: FriendData) => {
			setMe(_ => v);
			socket?.emit('userEntry', {user_id: v.id});
		}).catch( _ => router.replace('/404', router.asPath));
	}, [token]);

	useEffect(() => {
		if (!token){
			return ()=>{};
		}
		fetch('/backend/friend', init).then(v => v.json()).then((v: FriendData[]) => {
			const result = [] as FriendData[]
			v.forEach((v) => {
				result.push(v)
			});
			setFriends(result)
		})
	}, [token])

	useEffect(() => {
		if (!token){
			return ()=>{};
		}
		socket?.on('startGame', (message) => {
			const url_params = new URLSearchParams();
			const uri = new URL(window.location.href);
			url_params.append('player', message.player);
			router.push(`http://${uri.host}/game/${message.game}?${url_params.toString()}`);
		});
		return () => { socket?.off('startGame') }
	}, [token]);

	useEffect(()=>{
		if (!token){
			return ()=>{};
		}
		const event_source = new EventSource('/backend/game/event?' + query.toString());
		event_source.onmessage = ({data})=>console.log(data);
		return (()=>{event_source.close()});  
	},[token]);

	useEffect(()=>{
		const select_user = router.query.select_user;
		if (typeof select_user !== 'string')
			return ()=>{};
		createGame();
		setOpponent(parseInt(select_user));
		return ()=>{};
	},[router]);


	function entryGame() {
		setIsEntry(true);
		socket?.emit('entryGame', { user_id: me.id });
	}

	function quitGame() {
		setIsEntry(false);
		socket?.emit('quitGame', { user_id: me.id });
	}

	function createGame() {
		setIsCreating(true);
	}

	function moveToGame() {
		if (opponent === null)
			return
		const ball_speed = 2.0 + (ballSpeed - 3) * 0.4
		const paddle_speed = 1.2 + (paddleSpeed - 3) * 0.3
		socket?.emit('createGame', { user_id: me.id, ball_speed: ball_speed, paddle_speed: paddle_speed, max_score: maxScore, opponent: opponent });
	}

	function stopCreatingGame() {
		setIsCreating(false);
	}

	const handleBallSpeed = (e : ChangeEvent<HTMLInputElement>) => {
		setBallSpeed(_=>parseInt(e.target.value));
	}

	const handlePaddleSpeed = (e : ChangeEvent<HTMLInputElement>) => {
		setPaddleSpeed(_=>parseInt(e.target.value));
	}

	const handleMaxScore = (e : ChangeEvent<HTMLInputElement>) => {
		setMaxScore(_=>parseInt(e.target.value));
	}

	return (
		<>
		<Head>
			<title>transcendence:game</title>
			<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
		</Head>
		<main>
			<div className={Home_style.jwt_ture}>
				<aside className={Home_style.side_bar}>
					<Sidebar />
				</aside>

				<div className={Game_style.pong_game}>
					<h1 className={Game_style.font}>Pong Game</h1>
					<p className={Game_style.welcome}>Welcome to Pong game, choose your mode</p>

					{isEntry &&
					<div className={Friend_style.click_part} onClick={quitGame}>
						<div className={Friend_style.info}>
							<h2 className={Game_style.loading}>matching...</h2>
							<span className={`bx bx-x ${Friend_style.icon_info}`}></span>
						</div>
					</div>
					}
					
					{/* Friend Match */}
					{isCreating &&
					<div className={Friend_style.click_part}>
						<div className={Friend_style.info} onClick={stopCreatingGame}>
							<span className={`bx bx-x ${Friend_style.icon_info}`}></span>
						</div>
						
						<div className={Game_style.box}>
							<h1 className={Game_style.slider_name}>ball speed</h1>
							<div className={Game_style.slider}>
								<input type="range" min="1" max="5" step="1" value={ballSpeed} onChange={handleBallSpeed}/>
							</div>
							<div className={Game_style.value}>{ballSpeed}</div>

							<h1 className={Game_style.slider_name}>paddle speed</h1>
							<div className={Game_style.slider}>
								<input type="range" min="1" max="5" step="1" value={paddleSpeed} onChange={handlePaddleSpeed}/>
							</div>
							<div className={Game_style.value}>{paddleSpeed}</div>

							<h1 className={Game_style.slider_name}>max score</h1>
							<div className={Game_style.slider}>
								<input type="range" min="1" max="20" step="1" value={maxScore} onChange={handleMaxScore}/>
							</div>
							<div className={Game_style.value}>{maxScore}</div>

							<div className={Game_style.choose_friends}>
								{friends?.map(v=>(
									<div key={v.id} className={Game_style.imgs} onClick={()=>{setOpponent(v.id)}}>
										<img className={`${Game_style.friends_img} ${v.id === opponent && Game_style.imgs_clicked}`} src={v.avatar} alt="User img"></img>
									</div>
								))}
							</div>
						</div>
						<button className={Game_style.create_button} onClick={moveToGame}>create</button>
					</div>
					}

					<div className={Game_style.background}>
						<div>
							<button className={Game_style.match} onClick={entryGame}>Local Match</button>
							<p className={Game_style.explain}>This mode is for playing with someone else.</p>
						</div>
						<div>
							<button className={Game_style.match} onClick={createGame}>Friend Match</button>
							<p className={Game_style.explain}>This mode is for playing the game with friends.</p>
						</div>
					</div>
				</div>
			</div>
		</main>
		</>
	);
}
