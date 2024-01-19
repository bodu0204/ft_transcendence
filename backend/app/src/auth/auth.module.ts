import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtRegisterModule } from 'src/jwtRegister/jwtRegister.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
	imports: [ConfigModule.forRoot(), DatabaseModule, MailModule, JwtRegisterModule],
	controllers: [AuthController],
	providers: [
		AuthService,
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
	],
})
export class AuthModule {}
