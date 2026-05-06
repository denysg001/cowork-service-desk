import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { listSessions, login, refresh, revokeOtherSessions, revokeSession } from "./service.js";
import { isProduction } from "../../config/env.js";

const credentials = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const input = credentials.parse(request.body);
    const result = await login(input.email, input.password, {
      ip: request.ip,
      userAgent: request.headers["user-agent"]
    });
    reply.setCookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/api/v1/auth",
      maxAge: 60 * 60 * 24 * 30
    });
    return { accessToken: result.accessToken, user: result.user };
  });

  app.post("/auth/refresh", async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    const result = await refresh(refreshToken ?? "", { ip: request.ip, userAgent: request.headers["user-agent"] });
    reply.setCookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/api/v1/auth",
      maxAge: 60 * 60 * 24 * 30
    });
    return { accessToken: result.accessToken };
  });

  app.post("/auth/logout", { preHandler: [app.authenticate] }, async (request, reply) => {
    await revokeSession(request.user!.sessionId);
    reply.clearCookie("refreshToken", { path: "/api/v1/auth" });
    return { ok: true };
  });

  app.get("/auth/sessions", { preHandler: [app.authenticate] }, async (request) => listSessions(request.user!.id));

  app.delete("/auth/sessions/:id", { preHandler: [app.authenticate] }, async (request) => {
    const id = z.object({ id: z.string().uuid() }).parse(request.params).id;
    await revokeSession(id);
    return { ok: true };
  });

  app.delete("/auth/sessions", { preHandler: [app.authenticate] }, async (request) => {
    await revokeOtherSessions(request.user!.id, request.user!.sessionId);
    return { ok: true };
  });
}
