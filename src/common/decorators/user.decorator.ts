import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user (or a specific field) from the request.
 *
 * Usage:
 *   @GetUser()              → returns the full user object { userId, email, role }
 *   @GetUser('userId')      → returns just the userId string
 *   @GetUser('role')        → returns just the role
 */
export const GetUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return field ? user?.[field] : user;
  },
);
