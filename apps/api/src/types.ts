import type { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  sessionId: string;
};

declare module "fastify" {
  interface FastifyRequest {
    correlationId: string;
    user?: AuthUser;
  }
}
