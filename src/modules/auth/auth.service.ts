import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma/prisma.service';
import { RegisterDto } from './dtos/register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AuthResponse } from './dtos/auth-response';
import { LoginDto } from './dtos/login.dto';
import { OAuth2Client } from 'google-auth-library';
import { InvalidCredentialsException } from 'src/common/exceptions/auth/auth-exceptions';
import { StringValue } from "ms";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CREATE USER
  // =========================
  async createUser(data: RegisterDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
        },

        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      const tokens = await this.generateTokens(user);
      // Store the refresh token in the database
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        ...tokens,
        user,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  // =========================
  // FIND USER BY EMAIL
  // =========================
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  // =========================
  // FIND USER BY ID
  // =========================
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }
  async generateTokens(
    user: Omit<
      User,
      | 'password'
      | 'refreshToken'
      | 'createdAt'
      | 'updatedAt'
      | 'googleId'
      | 'profileImageUrl'
      | 'provider'
      | 'expoPushToken'
    >,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Implement JWT token generation logic here
    const payload = { sub: user.id, email: user.email, role: user.role };
    const refreshId = randomBytes(16).toString('hex');
    console.log(
      `JWT Secret Refresh is ${this.configService.get<string>('JWT_SECRET_REFRESH')}`,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<number>('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(
        { ...payload, refreshId },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRES_IN'),
        },
      ),
    ]);
    //console.log("DECODED:", this.jwtService.decode(accessToken));
   // console.log('DECODED:', this.jwtService.decode(refreshToken));

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
  async refreshTokens(userId: string): Promise<AuthResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    // if (!user || !(await bcrypt.compare(password, user.password))) {
    //   throw new UnauthorizedException('Invalid email or password');
    // }
    if (!user) {
      console.log('user not found');
      throw new InvalidCredentialsException();
    }
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      console.log('password not matches');

      throw new InvalidCredentialsException();
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
  async logout(id: string): Promise<void> {
    if (!id) {
      throw new Error('id is missing in logout');
    }
    await this.prismaService.user.update({
      where: { id },
      data: { refreshToken: null },
    });
  }
  // async googleLogin(
  //   googleAccessToken: string,
  // ): Promise<AuthResponse> {
  //   const response = await axios.get(
  //     "https://www.googleapis.com/oauth2/v3/userinfo",
  //     {
  //       headers: {
  //         Authorization: `Bearer ${googleAccessToken}`,
  //       },
  //     },
  //   );

  //   const googleUser = response.data;

  //   let user =
  //     await this.prisma.user.findUnique({
  //       where: {
  //         email: googleUser.email,
  //       },
  //     });

  //   if (!user) {
  //     user = await this.prisma.user.create({
  //       data: {
  //         email: googleUser.email,
  //         name: googleUser.name,
  //         googleId: googleUser.id,
  //         provider: "GOOGLE",
  //         profileImageUrl: googleUser.picture,
  //       },
  //     });
  //   }

  //   const tokens =
  //     await this.generateTokens(user);

  //   await this.updateRefreshToken(
  //     user.id,
  //     tokens.refreshToken,
  //   );

  //   return {
  //     ...tokens,
  //     user: {
  //       id: user.id,
  //       email: user.email,
  //       profileImageUrl: user.profileImageUrl,
  //       name: user.name,
  //       role: user.role,
  //     },
  //   };
  // }

  async googleLogin(idToken: string): Promise<AuthResponse> {
    try {
      // 1. VERIFY GOOGLE ID TOKEN
      //console.log('ID Token', idToken);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      // 2. GOOGLE USER DATA
      const googleUser = {
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        picture: payload.picture,
      };

      if (!googleUser.email) {
        throw new UnauthorizedException('Google email not found');
      }

      // 3. FIND USER
      let user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      // 4. CREATE USER IF NOT EXISTS
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.googleId,
            provider: 'GOOGLE',
            profileImageUrl: googleUser.picture,
          },
        });
      } else {
        // optional: update google info
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            profileImageUrl: googleUser.picture,
          },
        });
      }

      // 5. GENERATE TOKENS
      const tokens = await this.generateTokens(user);

      // 6. SAVE REFRESH TOKEN
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      // 7. RETURN RESPONSE
      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('Google login error:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }
  async refresh(refreshToken: string): Promise<AuthResponse> {
    console.log('refresh');
    try {
      // Verify refresh token
      console.log('refreshh');
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find user
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!user) {
        throw new UnauthorizedException();
      }

      // Check stored refresh token
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException();
      }

      // Generate ONLY access token
      const accessToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn:
            this.configService.getOrThrow<StringValue>('JWT_EXPIRES_IN'),
        },
      );

      return {
        accessToken,
        refreshToken, // return the same refresh token
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
        },
      };
    } catch {
      throw new UnauthorizedException('Refresh token expired');
    }
  }
}
