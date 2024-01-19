import { Controller, Get, Redirect, Req, Sse } from '@nestjs/common';
import { GameService } from './game.service';
import { AuthByQuery } from 'src/auth/auth.guard';
import { Observable, Subject } from 'rxjs';
import { AuthedReq } from 'src/auth/dto/auth.dto';
import { OnlineService } from 'src/online/online.service';

@Controller('game')
export class GameController {
	constructor(
		private readonly gameService: GameService,
		private readonly onlineService: OnlineService,		
	) {}

	@Sse('event')
	@AuthByQuery()
	event(@Req() {socket, user}: AuthedReq): Observable<MessageEvent> {
		const subject = new Subject<MessageEvent>();
		const del_func = this.onlineService.establishConnection(user.sub, 'GAME', subject);
		socket.on('close', del_func);
		return subject;
	}

}
