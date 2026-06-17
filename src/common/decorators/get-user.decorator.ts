import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Custom decorator to extract user from request
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    console.log('GetUser Decorator - Extracted User:', user);
    return data ? user?.[data] : user;
  },
);