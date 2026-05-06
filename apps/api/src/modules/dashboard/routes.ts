import type { FastifyInstance } from "fastify";
import type { CacheService } from "../../services/cache.js";
import { prisma } from "../../db/prisma.js";

export async function dashboardRoutes(app: FastifyInstance, cache: CacheService | null) {
  app.get("/dashboard/summary", { preHandler: [app.authenticate] }, async () => {
    const producer = async () => {
      const [open, urgent, paused] = await Promise.all([
        prisma.ticket.count({ where: { status: { in: ["NEW", "TRIAGE", "SCHEDULED", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_SUPPLIER", "PAUSED"] }, deletedAt: null } }),
        prisma.ticket.count({ where: { priority: "CRITICAL", deletedAt: null } }),
        prisma.ticket.count({ where: { status: "PAUSED", deletedAt: null } })
      ]);
      return { open, urgent, paused, generatedAt: new Date().toISOString(), consistency: "eventual" };
    };
    return cache ? cache.swr("dashboard:summary", 10, producer, 30) : producer();
  });
}
