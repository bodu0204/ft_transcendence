import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ButtonStatus, Display, GameObject, GameUserSets, GameUsers, Player, PlayerStatus, Pos, Room, RoomStatus } from './interface/game.interface';

@Injectable()
export class GameService {
	private logger: Logger = new Logger('GameService')
	private users: GameUsers = new Map<number, GameUserSets>()

	public rooms: Map<number, Room> = new Map<number, Room>()
	public queue: Array<number> = []

	// screen setting
	static readonly WIDTH: number = 1920
	static readonly HEIGHT: number = 1080

	// paddle setting
	static readonly PADDLE_WIDTH: number = GameService.WIDTH / 60
	static readonly PADDLE_HEIGHT: number = GameService.HEIGHT / 5
	static readonly PADDLE_MARGIN: number = GameService.WIDTH / 45
	static readonly PADDLE1_POS: Pos = { x: GameService.PADDLE_MARGIN, y: GameService.PADDLE_HEIGHT / 2 + GameService.PADDLE_MARGIN }
	static readonly PADDLE2_POS: Pos = { x: GameService.WIDTH - GameService.PADDLE_MARGIN, y: GameService.PADDLE_HEIGHT / 2 + GameService.PADDLE_MARGIN }
	static readonly PADDLE_SPEED: number = 1.2

	// ball setting
	static readonly BALL_WIDTH: number = 32
	static readonly BALL_HEIGHT: number = 32
	static readonly BALL_POS: Pos = { x: GameService.WIDTH / 2, y: GameService.HEIGHT / 2 }
	static readonly BALL_DIRECTION: Pos = { x: 1, y: 0.1 }
	static readonly BALL_MAX_RANGE: number = 1
	static readonly BALL_INIT_SPEED: number = 0.8
	static readonly BALL_SPEED: number = 2.0

	// frame rate setting
	static readonly FPS: number = 60
	static readonly SEC: number = 1000
	static readonly FRAME: number = GameService.SEC / GameService.FPS

	// setting for time
	static readonly TIMEOUT_MSEC: number = 30000
	static readonly SCORETIME_MSEC: number = 1800

	static readonly MAX_LEVEL: number = 100
	static readonly EXP_RATE: number = 1.5

	static readonly default_room: Room = Object.freeze({
		status: 'WAITING' as RoomStatus,
		display: { scale: { width: GameService.WIDTH, height: GameService.HEIGHT } },
		player1: { id: undefined, status: 'NOT_READY' as PlayerStatus, score: 0, paddle: { pos: GameService.PADDLE1_POS, scale: { width: GameService.PADDLE_WIDTH, height: GameService.PADDLE_HEIGHT }, speed: GameService.PADDLE_SPEED }, button: 'NOT_PRESSED' as ButtonStatus },
		player2: { id: undefined, status: 'NOT_READY' as PlayerStatus, score: 0, paddle: { pos: GameService.PADDLE2_POS, scale: { width: GameService.PADDLE_WIDTH, height: GameService.PADDLE_HEIGHT }, speed: GameService.PADDLE_SPEED }, button: 'NOT_PRESSED' as ButtonStatus },
		ball: { pos: GameService.BALL_POS, direction: GameService.BALL_DIRECTION, scale: { width: GameService.BALL_WIDTH, height: GameService.BALL_HEIGHT }, default_speed: GameService.BALL_SPEED, speed: GameService.BALL_INIT_SPEED },
		max_score: 10,
		last_updated: undefined,
	});

	constructor(private readonly databaseService: DatabaseService) {}

	getUserIdFromSocketId(socket_id: string): number | undefined {
		var user_id: number | undefined = undefined
		this.users.forEach((v, k) => {
			if (v.has(socket_id))
				user_id = k
		})
		return (user_id)
	}

	getUserSetsFromUserId(user_id: number | undefined): GameUserSets | undefined {
		if (user_id === undefined)
			return (undefined)
		return (this.users.get(user_id))
	}

	isUserInRoom(user_id: number): boolean {
		for (const room of this.rooms.values())
			if (room.player1.id === user_id || room.player2.id === user_id)
				return (true)
		return (false)
	}

	isUserInQueue(user_id: number): boolean {
		return (this.queue.includes(user_id))
	}

	// user management in game status
	async createLocalRoom(user_id: number, opponent_id: number, ball_speed: number, paddle_speed: number, max_score: number) {
		const room_id = await this.createGame(user_id, opponent_id)
		const room = this.rooms.get(room_id)
		if (room !== undefined) {
			room.ball.default_speed = ball_speed
			room.player1.paddle.speed = paddle_speed
			room.player2.paddle.speed = paddle_speed
			room.max_score = max_score
		}
		return (room_id)
	}

	joinLocalRoom(room_id: number, user_id: number) {
		const room = this.rooms.get(room_id)
		if (room !== undefined) {
			if (room.player2.id !== undefined || room.player2.id === room.player1.id ||  this.isUserInQueue(user_id) || this.isUserInRoom(user_id))
				return
			room.player2.id = user_id
			room.status = 'PLAYING'
		}
	}

	userEntry(user_id: number, socket_id: string) {
		const user_set = this.users.get(user_id)
		if (user_set) {
			user_set.add(socket_id)
		} else {
			const new_user_set = new Set<string>();
			new_user_set.add(socket_id);
			this.users.set(user_id, new_user_set);
		}
	}

	userQuit(socket_id: string) {
		this.users.forEach((v, k) => {
			if (v.has(socket_id))
				v.delete(socket_id)
			if (v.size === 0)
				this.users.delete(k)
		})
	}

	// update user status in queue
	joinQueue(user_id: number) {
		if (this.isUserInQueue(user_id) || this.isUserInRoom(user_id))
			return
		this.queue.push(user_id)
		this.logger.log(`Client in queue: ${user_id}`)
	}

	quitQueue(user_id: number) {
		const client_index: number = this.queue.indexOf(user_id);
		if (client_index !== -1) {
			this.queue.splice(client_index, 1);
			this.logger.log(`Client quited from queue: ${user_id}`)
		}
	}

	// game logic
	isHitBottomWall(ball: GameObject, next_ball_pos: Pos): boolean {
		return (next_ball_pos.y < ball.scale.height)
	}

	isHitTopWall(ball: GameObject, next_ball_pos: Pos): boolean {
		return (GameService.HEIGHT - ball.scale.height < next_ball_pos.y)
	}

	isHitLeftWall(ball: GameObject, next_ball_pos: Pos): boolean {
		return (next_ball_pos.x < ball.scale.width)
	}

	isHitRightWall(ball: GameObject, next_ball_pos: Pos): boolean {
		return (GameService.WIDTH - ball.scale.width < next_ball_pos.x)
	}

	isHitPaddle1(room: Room, next_ball_pos: Pos): boolean {
		const paddle: GameObject = room.player1.paddle
		return (next_ball_pos.x - room.ball.scale.width / 2 < paddle.pos.x + paddle.scale.width / 2
			&& (paddle.pos.y - paddle.scale.height / 2 <= next_ball_pos.y + room.ball.scale.height / 2
			&& next_ball_pos.y - room.ball.scale.height / 2 <= paddle.pos.y + paddle.scale.height / 2))
	}

	isHitPaddle2(room: Room, next_ball_pos: Pos): boolean {
		const paddle: GameObject = room.player2.paddle
		return (paddle.pos.x - paddle.scale.width / 2 < next_ball_pos.x + room.ball.scale.width / 2
			&& (paddle.pos.y - paddle.scale.height / 2 <= next_ball_pos.y + room.ball.scale.height / 2
			&& next_ball_pos.y - room.ball.scale.height / 2 <= paddle.pos.y + paddle.scale.height / 2))
	}

	updateScore(room: Room, next_ball_pos: Pos) {
		if (this.isHitLeftWall(room.ball, next_ball_pos))
			room.player2.score += 1
		else
			room.player1.score += 1
	}

	updatePaddle(player: Player) {
		if (player.button === 'UP_PRESSED') {
			if (player.paddle.pos.y - player.paddle.speed < player.paddle.scale.height / 2)
			player.paddle.pos.y = player.paddle.scale.height / 2
		else
			player.paddle.pos.y -= player.paddle.speed * GameService.FRAME
		} else if (player.button === 'DOWN_PRESSED') {
			if (player.paddle.pos.y + player.paddle.speed > GameService.HEIGHT - player.paddle.scale.height / 2)
				player.paddle.pos.y = (GameService.HEIGHT - player.paddle.scale.height / 2)
			else
				player.paddle.pos.y += player.paddle.speed * GameService.FRAME
		}
	}

	initBallStatus(room: Room) {
		room.ball.pos.x = GameService.BALL_POS.x
		room.ball.pos.y = GameService.BALL_POS.y
		room.ball.speed = GameService.BALL_INIT_SPEED
		if (room.ball.direction !== undefined) {
			if ((room.player1.score + room.player2.score) % 2 == 0)
				room.ball.direction.x = GameService.BALL_DIRECTION.x
			else
				room.ball.direction.x = -GameService.BALL_DIRECTION.x
			room.ball.direction.y = (-0.5 + Math.random()) / 3
		}
	}

	updateWaitingRoom(room_id: number, room: Room) {
		if (room.player1.id !== undefined)
			this.updatePaddle(room.player1)
		if (room.player2.id !== undefined)
			this.updatePaddle(room.player2)
	}

	async updateRoom(room_id: number, room: Room) {
		if (room.ball.direction === undefined)
			return
		// update paddle position
		if (room.player1.id !== undefined)
			this.updatePaddle(room.player1)
		if (room.player2.id !== undefined)
			this.updatePaddle(room.player2)

		// calculate next ball position
		const next_ball_pos: Pos = { x: room.ball.pos.x + room.ball.direction.x  * room.ball.speed * GameService.FRAME,
			y: room.ball.pos.y + room.ball.direction.y * room.ball.speed * GameService.FRAME }

		// check vertical collision
		if (this.isHitBottomWall(room.ball, next_ball_pos) || this.isHitTopWall(room.ball, next_ball_pos))
			room.ball.direction.y *= -1

		// check horizontal collision
		if (this.isHitPaddle1(room, next_ball_pos) || this.isHitPaddle2(room, next_ball_pos)) {
			room.ball.direction.x *= -1
			room.ball.speed = room.ball.default_speed !== undefined ? room.ball.default_speed : GameService.BALL_SPEED
			if (this.isHitPaddle1(room, next_ball_pos))
				room.ball.direction.y = (next_ball_pos.y - room.player1.paddle.pos.y) / (room.player1.paddle.scale.height / 2) * GameService.BALL_MAX_RANGE
			else
				room.ball.direction.y = (next_ball_pos.y - room.player2.paddle.pos.y) / (room.player2.paddle.scale.height / 2) * GameService.BALL_MAX_RANGE
		} else if (this.isHitLeftWall(room.ball, next_ball_pos) || this.isHitRightWall(room.ball, next_ball_pos)) {
			this.updateScore(room, next_ball_pos)
			// check game end
			if (room.player1.score == room.max_score || room.player2.score == room.max_score) {
				room.last_updated = performance.now()
				room.status = 'FINISHED'
				if (room.player1.id !== undefined && room.player2.id !== undefined) {
					await this.createResult(room.player1.id, room_id, room.player1.score)
					await this.createResult(room.player2.id, room_id, room.player2.score)
					await this.updateExp(room.player1.id, room.player1.score)
					await this.updateExp(room.player2.id, room.player2.score)
				}
			} else {
				this.initBallStatus(room)
			}
			return
		}

		room.ball.pos.x += room.ball.direction.x * room.ball.speed * GameService.FRAME
		room.ball.pos.y += room.ball.direction.y * room.ball.speed * GameService.FRAME
	}

	// database management
	async createGame(player1: number, player2?: number) {
		const {id} = await this.databaseService.games.create({})
		const room = JSON.parse(JSON.stringify(GameService.default_room))
		room.player1.id = player1
		if (player2 !== undefined)
			room.player2.id = player2
		room.status = 'WAITING'
		room.last_updated = performance.now()
		this.rooms.set(id, room)
		return (id)
	}

	async deleteGame(game_id: number) {
		await this.databaseService.games.delete({
			where: {
				id: game_id
			}
		})
	}

	async createResult(user_id: number, game_id: number, score: number) {
		await this.databaseService.results.create({
			data: {
				userId: user_id,
				gameId: game_id,
				score: score
			}
		})
	}

	calculateLevel(exp: number): number {
		const level_func = (level: number) => Math.floor(10 * ((1 - GameService.EXP_RATE ** level) / (1 - GameService.EXP_RATE)))

		let last_level_exp = 0
		for (let i = 1; i < GameService.MAX_LEVEL; i++) {
			const level_exp = level_func(i)
			if (exp < level_func(i))
				return (i - 1 + (exp - last_level_exp) / (level_exp - last_level_exp))
			last_level_exp = level_exp
		}
		return (GameService.MAX_LEVEL)
	}

	async updateExp(user_id: number, score: number) {
		const user = await this.databaseService.users.findUnique({
			where: {
				id: user_id
			}
		})
		if (user === null)
			return
		const exp = user.exp + score
		const level = this.calculateLevel(exp)
		await this.databaseService.users.update({
			where: {
				id: user_id
			},
			data: {
				exp: exp,
				level: level
			}
		})
	}
}
