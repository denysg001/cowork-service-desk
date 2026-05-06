import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: import("fastify").preHandlerAsyncHookHandler;
    requireRole: (...roles: import("@prisma/client").Role[]) => import("fastify").preHandlerAsyncHookHandler;
  }
}
