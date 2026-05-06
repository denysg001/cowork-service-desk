import type { FastifyInstance, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { unauthorized } from "../utils/errors.js";
import type { AuthUser } from "../types.js";

type AccessClaims = AuthUser & { type: "access" };

export async function authPlugin(app: FastifyInstance) {
  app.decorate("authenticate", async (request: FastifyRequest) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw unauthorized();
    const claims = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as AccessClaims;
    if (claims.type !== "access") throw unauthorized();
    const session = await prisma.session.findFirst({
      where: { id: claims.sessionId, userId: claims.id, revokedAt: null, expiresAt: { gt: new Date() } }
    });
    if (!session) throw unauthorized();
    request.user = { id: claims.id, email: claims.email, role: claims.role, sessionId: claims.sessionId };
  });
}
