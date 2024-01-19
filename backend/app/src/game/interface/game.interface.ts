export type GameUserSets = Set<string>

export type GameUsers = Map<number, GameUserSets>

export type ButtonStatus = 'UP_PRESSED' | 'DOWN_PRESSED' | 'NOT_PRESSED'

export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED' | 'DELETED'

export type PlayerStatus = 'NOT_READY' | 'READY'

export type Pos = {
	x: number,
	y: number,
}

export type Scale = {
	width: number,
	height: number,
}

export type Display = {
	scale: Scale,
}

export type GameObject = {
	pos: Pos,
	direction?: Pos,
	scale: Scale,
	default_speed?: number,
	speed: number,
}

export type Player = {
	id: number | undefined,
	status: PlayerStatus,
	score: number,
	paddle: GameObject,
	button: ButtonStatus,
}

export type Room = {
	status: RoomStatus
	display: Display,
	player1: Player,
	player2: Player,
	ball: GameObject,
	max_score: number,
	last_updated: number | undefined,
}
