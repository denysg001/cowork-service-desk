import Fastify from "fastify";
import { ZodError } from "zod";
import type { Redis } from "ioredis";
import { AppError } from "./utils/errors.js";
import { logger } from "./utils/logger.js";
import { correlationPlugin } from "./middleware/correlation.js";
import { timeoutPlugin } from "./middleware/timeout.js";
import { authPlugin } from "./middleware/auth.js";
import { registerSecurity } from "./plugins/security.js";
import { healthRoutes } from "./modules/health/routes.js";
import { authRoutes } from "./modules/auth/routes.js";
import { ticketRoutes } from "./modules/tickets/routes.js";
import { dashboardRoutes } from "./modules/dashboard/routes.js";
import { uploadRoutes } from "./modules/uploads/routes.js";
import { adminCrudRoutes } from "./modules/admin/crudRoutes.js";
import { chatRoutes } from "./modules/chat/routes.js";
import { notificationRoutes } from "./modules/notifications/routes.js";
import { reportRoutes } from "./modules/reports/routes.js";
import { dlqRoutes } from "./modules/admin/dlqRoutes.js";
import { httpDuration } from "./metrics/metrics.js";
import type { CacheService } from "./services/cache.js";
import { env } from "./config/env.js";

export async function buildApp(deps: { redis: Redis; cache: CacheService | null }) {
  const app = Fastify({
    logger: false,
    bodyLimit: env.BODY_LIMIT_BYTES,
    trustProxy: true
  });

  await app.register(correlationPlugin);
  await app.register(timeoutPlugin);
  await registerSecurity(app);
  await authPlugin(app);

  app.addHook("onResponse", async (request, reply) => {
    httpDuration.labels(request.method, request.routeOptions.url ?? "unknown", String(reply.statusCode)).observe(reply.elapsedTime / 1000);
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: { code: "VALIDATION_ERROR", message: "Invalid request", correlationId: request.correlationId, details: error.flatten() } });
    }
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ error: { code: error.code, message: error.message, correlationId: request.correlationId, details: error.details } });
    }
    logger.error("unhandled_error", { correlationId: request.correlationId, error });
    return reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "Internal server error", correlationId: request.correlationId } });
  });

  await healthRoutes(app, deps.redis);
  await app.register(async (v1) => {
    await authRoutes(v1);
    await ticketRoutes(v1, deps.cache);
    await dashboardRoutes(v1, deps.cache);
    await uploadRoutes(v1);
    await adminCrudRoutes(v1);
    await chatRoutes(v1);
    await notificationRoutes(v1);
    await reportRoutes(v1);
    await dlqRoutes(v1);
  }, { prefix: "/api/v1" });

  return app;
}
