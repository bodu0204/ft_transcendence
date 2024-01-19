import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { AuthedReq } from './dto/auth.dto';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector
	) {}

	canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		if (this.reflector.get<boolean>('NoAuthentication', context.getHandler()))
			return (true);

		switch (context.getType()) {
			case 'http':
				const req = context.switchToHttp().getRequest<AuthedReq>();
				let user = undefined;
				if (this.reflector.get<boolean>('AuthByQuery', context.getHandler())
					&& typeof req.query.access_token === 'string'
				) {
					try {
						user = this.jwtService.verify(req.query.access_token);
					} catch (_) {
						throw new UnauthorizedException();
					}
				} else {
					const [type, token] = req.headers.authorization?.split(' ') ?? [];
					try {
						user = type === 'Bearer' ? this.jwtService.verify(token) : undefined;
					} catch (_) {
						throw new UnauthorizedException();
					}
				}
				if (!user)
					throw new UnauthorizedException();
				req.user = user;
				break;
		
			default:
				break;
		}
		return true;
	}
}

export const NoAuthentication = () => SetMetadata('NoAuthentication', true);
export const AuthByQuery = () => SetMetadata('AuthByQuery', true);
