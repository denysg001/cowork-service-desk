import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { prisma } from "../../db/prisma.js";

export async function reportRoutes(app: FastifyInstance) {
  app.get("/reports/tickets", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async () => prisma.ticket.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }));
  app.get("/reports/operators", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async () => prisma.ticket.groupBy({ by: ["operatorId"], _count: true, where: { deletedAt: null } }));
  app.get("/reports/sla", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async () => prisma.ticket.groupBy({ by: ["slaStatus"], _count: true, where: { deletedAt: null } }));
  app.get("/reports/by-room", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async () => prisma.ticket.groupBy({ by: ["roomId"], _count: true, where: { deletedAt: null } }));
  app.post("/reports/jobs", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request, reply) => reply.code(202).send({ jobId: randomUUID(), status: "PENDING", correlationId: request.correlationId }));
  app.get("/reports/jobs/:jobId", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request) => ({ jobId: (request.params as { jobId: string }).jobId, status: "PENDING" }));
}
