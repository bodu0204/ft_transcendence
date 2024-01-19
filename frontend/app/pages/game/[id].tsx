import Head from "next/head";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FriendData } from '@/lib/types';
import { AccessToken, QueryOfAccessToken, RequestInit, Websocket } from "../_app";
import Game_styles from '../../styles/Game.module.css';

export default function Pong() {
	const router = useRouter();
	const id = router.query.id;
	const [me, setMe] = useState({} as FriendData);
	const [back, set_back] = useState(false);
	const init = useContext(RequestInit);
	const screenRef = useRef<HTMLCanvasElement>(null);
	const keys_pressed: Set<number> = new Set<number>();
	const searchParams = useSearchParams()
	const player: number = Number(searchParams.get('player'))
	const socket = useContext(Websocket).socket
	const [token] = useContext(AccessToken);

	// key setting
	const UP_KEY: number = 87;
	const DOWN_KEY: number = 83;

	// default window size setting
	const GAME_WIDTH: number = 1920;
	const GAME_HEIGHT: number = 1080;
	const DEFAULT_GAME_WIDTH: number = 1080
	const SCREEN_RATIO: number = 0.8;

	const [ratio, setRatio] = useState(DEFAULT_GAME_WIDTH / GAME_WIDTH * SCREEN_RATIO);

	const query = useContext(QueryOfAccessToken);

	function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
		if (player == 1)
			drawRectangle(ctx, (GAME_WIDTH - x) * ratio, y * ratio, width * ratio, height * ratio, color)
		else
			drawRectangle(ctx, x * ratio, y * ratio, width * ratio, height * ratio, color)
	}

	function drawPaddle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
		if (player == 1)
			drawRectangle(ctx, (GAME_WIDTH - x) * ratio, y * ratio, width * ratio, height * ratio, color)
		else
			drawRectangle(ctx, x * ratio, y * ratio, width * ratio, height * ratio, color)
	}

	function drawRectangle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
		ctx.beginPath();
		ctx.rect(x - width / 2, y - height / 2, width, height);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.closePath();
	}

	function drawString(ctx: CanvasRenderingContext2D, font_size: number, text: string, x: number, y: number) {
		ctx.font = "bold " + font_size * ratio + "px Arial, meiryo, sans-serif"
		const text_width = ctx.measureText(text).width

		if (player == 1)
			ctx.fillText(text, (GAME_WIDTH - x) * ratio - text_width / 2, y * ratio)
		else
			ctx.fillText(text, x * ratio - text_width / 2, y * ratio)
	}

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
			socket?.emit('userEntry', {user_id: v.id})
		}).catch( _ => router.replace('/404', router.asPath))
	}, [token])

	useEffect(() => {
		if (me.id !== undefined)
			socket?.emit('readyForGame', { room_id: id, player: player, user_id: me.id })
	}, [token, me.id])

	useEffect(() => {
		if (!token){
			return ()=>{};
		}
		if (typeof window !== "undefined") {
			const resizeHandler = () => {
				setRatio(window.innerWidth / GAME_WIDTH * SCREEN_RATIO)
			}
			window.addEventListener("resize", resizeHandler)
			resizeHandler()
			return () => window.removeEventListener("resize", resizeHandler)
		}
	}, [token])

	useEffect(() => {
		if (!token){
			return ()=>{};
		}
		const keyDownHandler = (event: any) => {
			const key: number = Number(event.keyCode)
			if (keys_pressed.has(key))
				return
			keys_pressed.add(key);

			const is_move_up = keys_pressed.has(UP_KEY)
			const is_move_down = keys_pressed.has(DOWN_KEY)
			if (is_move_up && !is_move_down)
				socket?.emit('movePaddle', { room_id: id, player: player, user_id: me.id, input: 'UP_PRESSED' })
			else if (!is_move_up && is_move_down)
				socket?.emit('movePaddle', { room_id: id, player: player, user_id: me.id, input: 'DOWN_PRESSED' })
			else
				socket?.emit('movePaddle', { room_id: id, player: player, user_id: me.id, input: 'NOT_PRESSED' })
		}

		const keyUpHandler = (event: any) => {
			const key: number = Number(event.keyCode)
			if (!keys_pressed.has(key))
				return
			keys_pressed.delete(key);

			const is_move_up = keys_pressed.has(UP_KEY)
			const is_move_down = keys_pressed.has(DOWN_KEY)
			if (is_move_up && !is_move_down)
				socket?.emit('movePaddle', { room_id: id, player: player, user_id: me.id, input: 'UP_PRESSED' })
			else if (!is_move_up && is_move_down)
				socket?.emit('movePaddle', { room_id: id, player: player, user_id: me.id, input: 'DOWN_PRESSED' })
			else
				socket?.emit('movePaddle', { room_id: id, player: player, user_id: me.id, input: 'NOT_PRESSED' })
		}

		document.addEventListener("keydown", keyDownHandler, false);
		document.addEventListener("keyup", keyUpHandler, false);
	}, [token, me.id]);

	useEffect(() => {
		if (!token){
			return ()=>{};
		}
		socket?.on('roomError', (room) => {
			router.replace('/404', router.asPath);
		})
		return () => { socket?.off('roomError') }
	}, [token])

	useEffect(() => {
		if (!token){
			return ()=>{};
		}
		const screen = screenRef.current
		if (!screen)
			throw new Error("No CONTENT")
		const ctx = screen.getContext('2d')
		if (!ctx)
			throw new Error("No CONTENT")

		socket?.on('updateGame', (room) => {
			ctx.clearRect(0, 0, GAME_WIDTH * ratio, GAME_HEIGHT * ratio);
			if (room.status === 'WAITING')
				drawString(ctx, 100, "WAITING", GAME_WIDTH / 2, GAME_HEIGHT / 2);
			else if (room.status === 'PLAYING')
				drawBall(ctx, room.ball.pos.x, room.ball.pos.y, room.ball.scale.width, room.ball.scale.height, "white");
			else if (room.status === 'FINISHED')
				drawString(ctx, 100, ((room.player1.score > room.player2.score && player == 1) || (room.player1.score < room.player2.score && player == 2)) ? "YOU WON!" : "YOU LOST!", GAME_WIDTH / 2, GAME_HEIGHT / 2);
			else if (room.status === 'DELETED') {
				set_back(_=>true);
			}
			if (room.player1.id !== undefined) {
				drawPaddle(ctx, room.player1.paddle.pos.x, room.player1.paddle.pos.y, room.player1.paddle.scale.width, room.player1.paddle.scale.height, "white");
			}
			if (room.player2.id !== undefined) {
				drawPaddle(ctx, room.player2.paddle.pos.x, room.player2.paddle.pos.y, room.player2.paddle.scale.width, room.player2.paddle.scale.height, "white");
			}
			drawString(ctx, 100, String(room.player1.score), GAME_WIDTH / 2 - 100, 120);
			drawString(ctx, 100, String(room.player2.score), GAME_WIDTH / 2 + 100, 120);
		})
		ctx.clearRect(0, 0, GAME_WIDTH * ratio, GAME_HEIGHT * ratio);
		return () => { socket?.off('updateGame') }
	}, [token, ratio])

	useEffect(()=>{
		if (back){
			router.replace('/game')
		}
	},[back]);

	useEffect(()=>{
		if (!token){
			return ()=>{};
		}
		const event_source = new EventSource('/backend/game/event?' + query.toString());
		event_source.onmessage = ({data})=>console.log(data);
		return (()=>{event_source.close()});  
	},[token]);

	return (
		<>
			<Head>
				<title>transcendence:pong</title>
			</Head>
			<main>
				<div className={Game_styles.game}>
					<canvas ref={screenRef} width={GAME_WIDTH * ratio} height={GAME_HEIGHT * ratio} className={Game_styles.screen}></canvas>
				</div>
			</main>
		</>
	)
}