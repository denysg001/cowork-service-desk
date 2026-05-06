import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/notifications", { preHandler: [app.authenticate] }, async (request) => prisma.notification.findMany({ where: { userId: request.user!.id, deletedAt: null }, orderBy: [{ read: "asc" }, { createdAt: "desc" }] }));
  app.patch("/notifications/:id/read", { preHandler: [app.authenticate] }, async (request) => prisma.notification.updateMany({ where: { id: z.object({ id: z.string().uuid() }).parse(request.params).id, userId: request.user!.id }, data: { read: true } }));
  app.patch("/notifications/read-all", { preHandler: [app.authenticate] }, async (request) => prisma.notification.updateMany({ where: { userId: request.user!.id, read: false }, data: { read: true } }));
}
