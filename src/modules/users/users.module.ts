import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
          secret: configService.get('JWT_SECRET') ?? 'default_secret2025',
          signOptions: { expiresIn: +configService.get('JWT_EXPIRES_IN', 900)},
        })
        })
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
