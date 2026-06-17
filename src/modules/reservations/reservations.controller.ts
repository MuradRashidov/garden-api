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

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}
  @Get('all')
  getAll() {
    return this.reservationsService.getAllReservations();
  }
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyReservations(@Req() req: RequestWithUser) {
    console.log('Fetching reservations for user ID:', req.user.id);
    return this.reservationsService.getMyReservations(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReservationDto, @Req() req: RequestWithUser) {
    return this.reservationsService.createReservation({
      ...dto,
      userId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateReservation(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reservationsService.updateReservation({
      id,
      userId: req.user.id,
      dto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelReservation(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.reservationsService.cancelReservation({
      id,
      userId: req.user.id,
    });
  }
  
}
