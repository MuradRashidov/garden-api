import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    console.log(`hgkkhgkgkhkgkg`);
    // console.log("Ctx",context);
    
    return super.canActivate(context);
  }
  handleRequest(err, user,info) {
    // console.log("ERR:", err);
    // console.log("USER:", user);
    // console.log("INFO:", info);

  if (err || !user) {
    throw err || new UnauthorizedException();
  }

  return user;
}
}