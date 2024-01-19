import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameService } from './game.service';
import { GameUserSets, Player, Room } from './interface/game.interface';
import { Interval } from '@nestjs/schedule';
import { ChatService } from 'src/chat/chat.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({cors: {origin: '*', methods: ['GET', 'POST'],}})
export class GameGateway {
	private logger: Logger = new Logger('GameGateway')

	constructor(
		private readonly gameService: GameService,
		private readonly chatService: ChatService,
		private readonly configService: ConfigService) {}

	@WebSocketServer()
	private server: Server

	afterInit(server: Server) {
		this.logger.log('GameGateway initialized')
	}

	handleConnection(@ConnectedSocket() client: Socket) {
		this.logger.log(`Client connected: ${client.id}`)
	}

	handleDisconnect(@ConnectedSocket() client: Socket) {
		this.gameService.userQuit(client.id)
		const user_id = this.gameService.getUserIdFromSocketId(client.id)
		if (user_id !== undefined)
			this.gameService.quitQueue(user_id)
		this.logger.log(`Client disconnected: ${client.id}`)
	}

	notifyUsers(user_sets: GameUserSets | undefined, message: string, data: any) {
		if (user_sets === undefined)
			return
		user_sets.forEach((element) => {
			this.server.to(element).emit(message, data)
		})
	}

	@Interval(GameService.SEC / GameService.FPS)
	async updateGameStatus() {
		this.gameService.rooms.forEach((room_detail, room_id) => {
			if (room_detail.status === 'WAITING') {
				this.gameService.updateWaitingRoom(room_id, room_detail)
			} else if (room_detail.status === 'PLAYING') {
				this.gameService.updateRoom(room_id, room_detail)
			} else if (room_detail.status === 'FINISHED') {
				if (room_detail.last_updated !== undefined && performance.now() - room_detail.last_updated > GameService.SCORETIME_MSEC)
					room_detail.status = 'DELETED'
			} else if (room_detail.status === 'DELETED') {
				if (this.gameService.rooms.has(room_id))
					this.gameService.rooms.delete(room_id)
			}
			this.notifyUsers(this.gameService.getUserSetsFromUserId(room_detail.player1.id), 'updateGame', room_detail)
			this.notifyUsers(this.gameService.getUserSetsFromUserId(room_detail.player2.id), 'updateGame', room_detail)
		})
	}

	@Interval(GameService.SEC)
	async startGame() {
		while (this.gameService.queue.length >= 2) {
			const player1 = this.gameService.queue.shift()
			const player2 = this.gameService.queue.shift()
			if (player1 !== undefined && player2 !== undefined) {
				const game_id = await this.gameService.createGame(player1, player2)
				this.notifyUsers(this.gameService.getUserSetsFromUserId(player1), 'startGame', {game: game_id, player: 1})
				this.notifyUsers(this.gameService.getUserSetsFromUserId(player2), 'startGame', {game: game_id, player: 2})
				this.logger.log(`Game ${game_id}: ${player1} vs ${player2}`)
			} else {
				if (player1 !== undefined)
					this.gameService.queue.unshift(player1)
				else if (player2 !== undefined)
					this.gameService.queue.unshift(player2)
			}
		}
	}

	@Interval(GameService.SEC)
	playGame() {
		this.gameService.rooms.forEach((room_detail, room_id) => {
			if (room_detail.status === 'WAITING') {
				if (room_detail.player1.status === 'READY' && room_detail.player2.status === 'READY')
					room_detail.status = 'PLAYING'
				else if (room_detail.last_updated !== undefined && performance.now() - room_detail.last_updated > GameService.TIMEOUT_MSEC) {
					this.gameService.deleteGame(room_id)
					room_detail.status = 'DELETED'
				} else if (room_detail.player2.id === undefined && this.gameService.getUserSetsFromUserId(room_detail.player1.id) === undefined) {
					this.gameService.deleteGame(room_id)
					room_detail.status = 'DELETED'
				}
			}
		})
	}

	@SubscribeMessage('userEntry')
	userEntry(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
		this.gameService.userEntry(body.user_id, client.id)
		this.logger.log(`Client entered: ${client.id} (user_id ${body.user_id})`)
	}

	@SubscribeMessage('entryGame')
	joinGame(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
		this.gameService.joinQueue(body.user_id)
	}

	@SubscribeMessage('quitGame')
	quitGame(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
		this.gameService.quitQueue(body.user_id)
	}

	@SubscribeMessage('createGame')
	async createGame(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
		if (this.gameService.isUserInQueue(body.user_id) || this.gameService.isUserInRoom(body.user_id)
			|| this.gameService.isUserInQueue(body.opponent) || this.gameService.isUserInRoom(body.opponent))
			return
		const game_id = await this.gameService.createLocalRoom(body.user_id, body.opponent, body.ball_speed, body.paddle_speed, body.max_score)
		this.notifyUsers(this.gameService.getUserSetsFromUserId(body.user_id), 'startGame', {game: game_id, player: 1})
		const url_params = new URLSearchParams()
		url_params.append('player', "2")
		this.chatService.sendDM(body.user_id, body.opponent, `http://${this.configService.get<string>('DOMAIN_NAME') || 'localhost'}/game/${game_id}?${url_params.toString()}`);
	}

	@SubscribeMessage('readyForGame')
	async readyForGame(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
		const room_detail: Room | undefined = this.gameService.rooms.get(Number(body.room_id))

		if (room_detail === undefined) {
			client.emit('roomError')
			return
		}
		const user_id = Number(body.user_id)
		switch (Number(body.player)) {
			case 1:
				if (user_id === room_detail.player1.id)
					room_detail.player1.status = 'READY';
				break
			case 2:
				if (user_id === room_detail.player2.id)
					room_detail.player2.status = 'READY';
				break
			default:
				return
		}
	}

	@SubscribeMessage('movePaddle')
	movePaddle(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
		const room_detail: Room | undefined = this.gameService.rooms.get(Number(body.room_id))

		const user_id = Number(body.user_id)
		if (room_detail === undefined)
			return
		switch (Number(body.player)) {
			case 1:
				if (user_id === room_detail.player1.id)
					room_detail.player1.button = body.input
				break
			case 2:
				if (user_id === room_detail.player2.id)
					room_detail.player2.button = body.input
				break
			default:
				return
		}
	}
}
