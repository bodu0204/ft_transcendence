import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

export const JwtRegisterModule = JwtModule.registerAsync({
	imports: [ConfigModule],
	useFactory: async (configService: ConfigService) => ({
		secret: configService.get<string>('JWT_SECRET'),
		signOptions: { expiresIn: '7 days' },
	}),
	inject: [ConfigService],
});
