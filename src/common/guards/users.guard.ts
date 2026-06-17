import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector:Reflector) {}
    
  canActivate(context: ExecutionContext): boolean  {
        console.log(444444);

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    console.log(`User ${user}`);
    
    console.log(`Role is ${user.role}`);
    
    return requiredRoles.some((role) => user.role === role);

  }
}