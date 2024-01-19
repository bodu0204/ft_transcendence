import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthDto, IdPassDto, UserDetail } from './dto/auth.dto';
import { validate } from 'class-validator';
import { Jwt } from './interface/auth.interface';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from 'src/database/database.service';
import { Prisma, Status, Users } from '.prisma/client';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
	private readonly redirect_uri_to_intra: string; //42サーバーがユーザーを自分のサーバーにRedirectさせるためのURI
	private readonly redirect_uri_to_local: string; //自分のサーバーがユーザーを42サーバーにRedirectさせるためのURI

	constructor (
		private readonly database: DatabaseService,
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
		private readonly mailerService: MailerService,
	) {
		this.redirect_uri_to_intra = `http://${this.configService.get<string>('DOMAIN_NAME') || 'localhost'}`;

		const url_params = new URLSearchParams();
		url_params.append('client_id', this.configService.get<string>('OAUTH_UID') || '');
		url_params.append('redirect_uri', this.redirect_uri_to_intra);
		url_params.append('response_type', 'code');

		this.redirect_uri_to_local = this.configService.get<string>('USER_REDIRECT_ENDPOINT') + '?' + url_params.toString();
	}

	get RedirectUriToLocal(): string {
		return this.redirect_uri_to_local;
	}

	private async fetchAccessToken(authorization_code: string): Promise<string> {

		const url_params = new URLSearchParams();
		url_params.append('grant_type', 'authorization_code');
		url_params.append('code', authorization_code);
		url_params.append('client_id', this.configService.get<string>('OAUTH_UID') || '');
		url_params.append('client_secret', this.configService.get<string>('OAUTH_SECRET') || '');
		url_params.append('redirect_uri', this.redirect_uri_to_intra);

		const request: RequestInit = {
			method: "POST",
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: url_params.toString()
		};

		try {
			const res = await fetch(this.configService.get<string>('ACCESS_TOKEN_ENDPOINT') || '', request)
			const user_data = await res.json()
			if (typeof user_data?.access_token === 'string')
				return user_data.access_token
		} catch (error) {
			throw new NotFoundException();
		}
		throw new InternalServerErrorException()
	}

	generateJwtToken(userId: number): Jwt {
		const payload = { sub: userId }
		const jwt_token = { access_token: this.jwtService.sign(payload) }
		return jwt_token
	}

	async getUserDetail(authorization_code: string): Promise<UserDetail> {
		const access_token = await this.fetchAccessToken(authorization_code);

		const request = {
			method: "GET",
			headers: {
				Authorization: "bearer " + access_token,
			},
		};

		try {
			const res = await fetch(this.configService.get<string>('USER_DATA_ENDPOINT') || '', request)
			const user_data = await res.json()

			const {id: intraId, email, login: name, image: {link: avatar}} = user_data

			const user_detail  = new UserDetail()
			user_detail.intraId = intraId;
			user_detail.email = email;
			user_detail.name = name;
			user_detail.avatar = avatar;

			if ((await validate(user_detail)).length > 0)
				throw 'validate error';
			return (user_detail);
		} catch (error) {
			throw new InternalServerErrorException();
		}
	}

	async searchUserFromIntraId(intraId: number): Promise<Users | null> {
		const user = await this.database.users.findUnique({
			where: {
				intraId: intraId
			}
		})
		return user
	}

	async upsertUserFromEmail(user_detail: UserDetail) {
		const user = await this.database.users.upsert({
			where: {
				email: user_detail.email,
			},
			update: {
				intraId: user_detail.intraId,
			},
			create: {
				status: Status.ONLINE,
				...user_detail,
			},
		});
		return user;
	}

	async sendTwoFactorMail(email: string, one_time_uri: string) {
		try {
			await this.mailerService.sendMail({
				to: email,
				subject: 'ft_transcendence 2要素認証のお知らせ',
				template: './twofactor',
				context: {
					url: one_time_uri,
					time: "10分",
				}
			})
		} catch (error) {
			console.log(error)
		}
	}

	async sendVerificationMail(email: string, one_time_uri: string) {
		try {
			await this.mailerService.sendMail({
				to: email,
				subject: 'ft_transcendence アカウント認証のお知らせ',
				template: './template',
				context: {
					url: one_time_uri,
					time: "10分",
				}
			})
		} catch (error) {
			console.log(error)
		}
	}

	async preSignup(dto: AuthDto) {
		const hashedPassword = await bcrypt.hash(dto.password, 12);

		const user = await this.database.users.findUnique({
			where: {
				email: dto.email,
			},
		});

		if (user)
			throw new ForbiddenException('This email is already taken');

		const deadline = new Date()
		deadline.setMinutes(deadline.getMinutes() + 10);

		const token = this.jwtService.sign({ email: dto.email, deadline: deadline })

		const url_params = new URLSearchParams()
		url_params.append('one_time_token', token)
		const one_time_uri = "http://" + this.configService.get<string>('DOMAIN_NAME') + "?" + url_params.toString()

		try {
			await this.database.preUsers.upsert({
				where: {
					email: dto.email
				},
				update: {
					deadline: deadline,
					name: dto.name,
					hashedPassword: hashedPassword,
					token: token,
				},
				create: {
					deadline: deadline,
					email: dto.email,
					name: dto.name,
					hashedPassword: hashedPassword,
					token: token,
				},
			})
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ForbiddenException('Duplicate token generated');
				}
			}
			throw error;
		}

		await this.sendVerificationMail(dto.email, one_time_uri)
	}

	async signupPreUsers(pre_user: any) {
		const now = new Date()

		if (now.getTime() > pre_user.deadline.getTime())
			throw new ForbiddenException('One-time uri out of time');
		
		await this.database.preUsers.delete({
			where: {
				id: pre_user.id
			}
		})

		try {
			const user = await this.database.users.create({
				data: {
					email: pre_user.email,
					name: pre_user.name,
					hashedPassword: pre_user.hashedPassword,
					avatar: `http://${this.configService.get<string>('DOMAIN_NAME') || 'localhost'}/image/icon${(Math.floor(Math.random() * 1024) % 4)+1}.jpg`,
					status: Status.ONLINE
				},
			});

			return this.generateJwtToken(user.id)
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ForbiddenException('The user already exists');
				}
			}
			throw error;
		}
	}

	async signupAuthUsers(auth_user: any) {
		const now = new Date()

		if (now.getTime() > auth_user.deadline.getTime())
			throw new ForbiddenException('One-time uri out of time');
		
		await this.database.authUsers.delete({
			where: {
				id: auth_user.id
			}
		})

		return this.generateJwtToken(auth_user.userId)
	}

	async signup(token: string): Promise<Jwt> {
		const pre_user = await this.database.preUsers.findUnique({
			where: {
				token: token
			}
		})

		if (pre_user) {
			return await this.signupPreUsers(pre_user);
		}

		const auth_user = await this.database.authUsers.findUnique({
			where: {
				token: token
			}
		})

		if (auth_user) {
			return await this.signupAuthUsers(auth_user);
		}

		throw new NotFoundException("Invalid one-time uri")
	}

	async login(dto: IdPassDto): Promise<Jwt> {
		const user = await this.database.users.findUnique({
			where: {
				email: dto.email,
			},
		});

		if (!user)
			throw new ForbiddenException('Email or password incorrect');
		if (typeof user.hashedPassword !== 'string')
			throw new ForbiddenException('No Password information set for user');

		const isValid = await bcrypt.compare(dto.password, user.hashedPassword);

		if (!isValid) throw new ForbiddenException('Email or password incorrect');

		if (user.isAuthentication) {
			const deadline = new Date()
			deadline.setMinutes(deadline.getMinutes() + 10);

			const token = this.jwtService.sign({ email: user.email, deadline: deadline })

			const url_params = new URLSearchParams()
			url_params.append('one_time_token', token)
			const one_time_uri = "http://" + this.configService.get<string>('DOMAIN_NAME') + "?" + url_params.toString()

			try {
				await this.database.authUsers.upsert({
					where: {
						userId: user.id
					},
					update: {
						deadline: deadline,
						token: token,
					},
					create: {
						deadline: deadline,
						userId: user.id,
						token: token,
					},
				})

				this.sendTwoFactorMail(user.email, one_time_uri)
				throw new NotFoundException("No jwt token found")
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === 'P2002') {
						throw new ForbiddenException('Duplicate token generated');
					}
				}
				throw error;
			}
		}

		return this.generateJwtToken(user.id)
	}
}
