import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Users } from '@prisma/client';
import { NoAuthentication } from './auth.guard';
import { Jwt } from './interface/auth.interface';
import { AuthDto, IdPassDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
	) {}

	@Get('verify')
	@NoAuthentication()
	async verify(@Query('code')authorization_code: string): Promise<Jwt | null> {
		const user_detail = await this.authService.getUserDetail(authorization_code)
		let user: Users | null;

		if (typeof user_detail.intraId !== 'number')
			return null

		user = await this.authService.searchUserFromIntraId(user_detail.intraId);
		if (!user)
			user = await this.authService.upsertUserFromEmail(user_detail);

		return this.authService.generateJwtToken(user.id);
	}

	@Get('redirect')
	@Redirect()
	@NoAuthentication()
	redirectToOAuthServer() {
		return {
			url: this.authService.RedirectUriToLocal,
			statusCode: 302
		}
	}

	@Post('pre_signup')
	@NoAuthentication()
	async preSignup(@Body() dto: AuthDto) {
		return await this.authService.preSignup(dto);
	}

	@Get('signup/:token')
	@NoAuthentication()
	async signup(@Param('token')token: string) {
		return await this.authService.signup(token);
	}

	@Post('login')
	@NoAuthentication()
	async login(@Body() dto: IdPassDto):Promise<Jwt> {
		return await this.authService.login(dto);
	}
}
