import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule], // NotificationsModule əlavə edildi
  controllers: [ReservationsController],
  providers: [ReservationsService]
})
export class ReservationsModule {}
