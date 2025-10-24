import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/modules/user/entities/user.entity';
interface AuthenticatedRequest extends Request {
  user: User;
}
export const UserParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const user: User = ctx
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().user;
    return user;
  },
);
