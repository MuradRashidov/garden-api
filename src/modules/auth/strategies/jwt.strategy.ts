// Jwt Strategy for auth requests
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    //console.log(23424324324);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'default_secret2025',
    });
  }

  // Validate JWT payload
async validate(payload: { sub: string; email: string }) {
  //console.log('JWT Payload:', payload);

  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

 // console.log('User from DB:', user);
 // console.log("JWT SECRET:", this.configService.get("JWT_SECRET"));

  return user;
}
}