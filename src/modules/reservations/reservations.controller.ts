import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationsService } from './reservations.service';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateReservationDto } from './dtos/update-reservation.dto';
import { Reservation } from './dtos/reservation-list-reponse.dto';
import { AuthResponse } from '../auth/dtos/auth-response';

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}
  @Get('all')
  async getAll(): Promise<Reservation[]> {
    return await this.reservationsService.getAllReservations();
  }
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyReservations(@Req() req: RequestWithUser) {
    console.log('Fetching reservations for user ID:', req.user.id);
    return await this.reservationsService.getMyReservations(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateReservationDto, @Req() req: RequestWithUser) {
    return await this.reservationsService.createReservation({
      ...dto,
      userId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateReservation(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.reservationsService.updateReservation({
      id,
      userId: req.user.id,
      dto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelReservation(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return await this.reservationsService.cancelReservation({
      id,
      userId: req.user.id,
    });
  }
}
