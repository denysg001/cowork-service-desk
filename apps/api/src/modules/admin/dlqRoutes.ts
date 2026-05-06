import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";

export async function dlqRoutes(app: FastifyInstance) {
  app.get("/admin/dlq", { preHandler: [app.requireRole("ADMIN")] }, async () => prisma.deadLetterJob.findMany({ orderBy: [{ createdAt: "desc" }], take: 100 }));
  app.post("/admin/dlq/:jobId/retry", { preHandler: [app.requireRole("ADMIN")] }, async (request) => ({ ok: true, jobId: z.object({ jobId: z.string() }).parse(request.params).jobId, status: "QUEUED_FOR_MANUAL_RETRY" }));
}
