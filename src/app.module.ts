import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma/prisma.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { PrismaService } from './prisma/prisma/prisma.service';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './modules/cloudianry/cloudinary.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
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
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
