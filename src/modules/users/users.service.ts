import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma/prisma.service';
import { UserRegisterDto } from './dtos/user-register.dto';


@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
  ) {}
 async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImageUrl: true,
      },
    });
  }
  
}