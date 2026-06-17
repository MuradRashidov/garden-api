import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { AuthResponse } from './dtos/auth-response';
import { LoginDto } from './dtos/login.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GoogleLoginDto } from './dtos/google-login.dto';




@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // =========================
  // REGISTER USER
  // =========================
  @Post('register')
  createUser(
    @Body() body: RegisterDto,
  ) {
    return this.authService.createUser(
      body,
    );
  }

  @Post('login')
  // @ApiOperation({
  //   summary: 'User login',
  //   description: 'Authenticates a user and returns access and refresh tokens',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User successfully logged in',
  //   type: AuthResponse,
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Unauthorized. Invalid credentials',
  // })
  // @ApiResponse({
  //   status: 429,
  //   description: 'Too Many Requests. Rate limit exceeded',
  // })
  // @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return await this.authService.login(loginDto);
  }

  @Post("logout")
   @UseGuards(JwtAuthGuard)
  async logout(@GetUser('id') id: string): Promise<{ message: string }> {
    await this.authService.logout(id);
    return { message: 'Successfully logged out' };
  }
@Post("google")
async googleLogin(
  @Body() dto: GoogleLoginDto,
) {
  return this.authService.googleLogin(
    dto.accessToken,
  );
}

}