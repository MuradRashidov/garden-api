import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [NotificationsModule,MailModule], // NotificationsModule əlavə edildi
  controllers: [ReservationsController],
  providers: [ReservationsService]
})
export class ReservationsModule {}
