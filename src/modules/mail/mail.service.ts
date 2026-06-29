import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  reservationCreatedTemplate,
  ReservationEmailData,
} from './templates/reservation-created.template';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get('MAIL_PORT')),
      secure: true,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      console.log('✅ Mail server connected');
    } catch (err) {
      console.log('❌ Mail server error', err);
    }
  }
  async sendMail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      subject,
      html,
    });
  }
  async sendReservationEmail(to: string, data: ReservationEmailData) {
    try {
      console.log('mail1');
      const info = await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        to,
        subject: 'Your Reservation Confirmation',
        html: reservationCreatedTemplate(data),
      });

      console.log('MAIL SENT');
      console.log(info);
    } catch (error) {
      console.log('mail2', error);
    }
  }
}
