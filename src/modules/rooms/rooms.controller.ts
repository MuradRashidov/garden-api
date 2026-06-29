import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/users.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateRoomTypeDto } from './dtos/CreateRoomType.dto';
import * as multer from 'multer';
import { UpdateRoomTypeDto } from './dtos/UpdateRoomType.dto';
import { UserRole } from '@prisma/client';
import { UnblockRoomDto } from './dtos/UnblockRoom.dto';
import { BlockRoomDto } from './dtos/BlockRoom.dto';
import { AvailabilityQueryDto } from './dtos/avaitability-query.dto';
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CUSTOMER')
  @Get()
  async getRooms(
    @Req() req: any,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
  ) {
    console.log('Received query parameters:', { checkIn, checkOut });
    return this.roomsService.getRooms(checkIn, checkOut, req.user.role);
  }
  @Get('recommended')
  async recommendendRooms() {
    return this.roomsService.recommendedRooms();
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('create')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: multer.memoryStorage(),
    }),
  )
  async createRoom(
    @Body() dto: CreateRoomTypeDto,
    @UploadedFiles()
    files: Express.Multer.File[],
  ) {
    return this.roomsService.createRoom(dto, files);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: multer.memoryStorage(),
    }),
  )
  async updateRoom(
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.roomsService.updateRoomType(id, dto, files);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/delete')
  deleteRoomType(@Param('id') id: string) {
    return this.roomsService.deleteRoomType(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('availability')
  async getAvailability(
    @Query('start') start?: string,
    @Query('days') days?: string,
  ) {
    return await this.roomsService.getAvailability(start, Number(days) || 30);
  }
  // =========================
  // BLOCK ROOM
  // =========================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('availability/search')
  async searchAvailability(@Query() query: AvailabilityQueryDto) {
    return await this.roomsService.searchAvailability(query.start, query.end);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('block')
  @Roles(UserRole.ADMIN)
  async blockRoom(@Body() dto: BlockRoomDto, @Req() req: any) {
    return await this.roomsService.blockRoom(dto, req.user.id);
  }

  // =========================
  // UNBLOCK ROOM
  // =========================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('unblock')
  async unblockRoom(@Body() dto: UnblockRoomDto) {
    return await this.roomsService.unblockRoom(dto);
  }
}
