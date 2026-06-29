import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { UsersService } from './users.service';
import { UserRegisterDto } from './dtos/user-register.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // =========================
  // GET CURRENT USER
  // =========================
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    console.log('Current user ID:', req.user.id);
    return await this.usersService.findById(req.user.id);
  }
  @Post('push-token')
  @UseGuards(JwtAuthGuard)
  async savePushToken(
    @Req() req: RequestWithUser,
    @Body() body: { pushToken: string },
  ) {
    console.log('Push Token is', body.pushToken);
    return await this.usersService.savePushToken(req.user.id, body.pushToken);
  }
}
