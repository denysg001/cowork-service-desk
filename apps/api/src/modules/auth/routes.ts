import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { login, refresh, revokeSession } from "./service.js";
import { isProduction } from "../../config/env.js";

const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });

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
      sameSite: "strict",
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
      sameSite: "strict",
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
}
