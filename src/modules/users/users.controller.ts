import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UserRegisterDto } from './dtos/user-register.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';


@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

    // =========================
  // GET CURRENT USER
  // =========================
  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@Req() req: RequestWithUser) {
    console.log("Current user ID:", req.user.id);
    return this.usersService.findById(
      req.user.id
    );
  }

 
}