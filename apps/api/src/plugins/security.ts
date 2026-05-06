import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import type { FastifyInstance } from "fastify";
import { corsOrigins, env, isProduction } from "../config/env.js";

export async function registerSecurity(app: FastifyInstance) {
  await app.register(sensible);
  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: "onRequest",
    parseOptions: { httpOnly: true, secure: isProduction, sameSite: isProduction ? "strict" : "lax", path: "/api/v1" }
  });
  await app.register(cors, {
    origin(origin, cb) {
      if (!origin || corsOrigins.includes(origin)) cb(null, true);
      else cb(new Error("Origin not allowed"), false);
    },
    credentials: true
  });
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", ...corsOrigins],
        imgSrc: ["'self'", "data:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      }
    },
    hsts: isProduction ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false,
    frameguard: { action: "sameorigin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 5 } });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.user?.id ?? request.ip
  });
}
