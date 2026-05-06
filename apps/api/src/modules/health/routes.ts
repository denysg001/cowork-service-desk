import type { FastifyInstance } from "fastify";
import { prisma } from "../../db/prisma.js";
import type { Redis } from "ioredis";
import { registry } from "../../metrics/metrics.js";

export async function healthRoutes(app: FastifyInstance, redis: Redis) {
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));
  app.get("/ready", async (_request, reply) => {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    return reply.send({ status: "ready", timestamp: new Date().toISOString() });
  });
  app.get("/metrics", async (_request, reply) => {
    reply.header("content-type", registry.contentType);
    return registry.metrics();
  });
}
