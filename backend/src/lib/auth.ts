import type { MiddlewareHandler } from 'hono';

export const authenticateUser: MiddlewareHandler = async (c, next) => {
  const userId = c.req.header('x-user-id') || 'anonymous';
  c.set('userId' as never, userId);
  await next();
};
