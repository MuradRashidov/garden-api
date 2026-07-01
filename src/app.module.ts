import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma/prisma.module';
import { RoomsModule } from './modules/rooms/rooms.module';

import { ReservationsModule } from './modules/reservations/reservations.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './modules/cloudianry/cloudinary.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MailModule } from './modules/mail/mail.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

@Module({
  imports: [
    PrismaModule,
    RoomsModule,
    ReservationsModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, // hər yerdə istifadə olunsun
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 dəqiqə
        limit: 100, // 100 sorğu
      },
    ]),
    CloudinaryModule,
    NotificationsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
