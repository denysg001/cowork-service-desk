import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { createMessageSchema } from "@cowork/shared";
import { prisma } from "../../db/prisma.js";

const params = z.object({ id: z.string().uuid() });
const channelParams = z.object({ id: z.string().uuid(), channel: z.enum(["client", "internal"]) });

export async function chatRoutes(app: FastifyInstance) {
  app.get("/tickets/:id/messages/client", { preHandler: [app.authenticate] }, async (request) => listMessages(params.parse(request.params).id, "CLIENT"));
  app.get("/tickets/:id/messages/internal", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request) => listMessages(params.parse(request.params).id, "INTERNAL"));
  app.post("/tickets/:id/messages/client", { preHandler: [app.authenticate] }, async (request, reply) => createMessage(reply, params.parse(request.params).id, request.user!.id, "CLIENT", request.body));
  app.post("/tickets/:id/messages/internal", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request, reply) => createMessage(reply, params.parse(request.params).id, request.user!.id, "INTERNAL", request.body));
  app.patch("/tickets/:id/messages/read", { preHandler: [app.authenticate] }, async (request) => {
    const { id } = params.parse(request.params);
    await prisma.message.updateMany({ where: { ticketId: id, deletedAt: null, NOT: { readBy: { has: request.user!.id } } }, data: { readBy: { push: request.user!.id } } });
    return { ok: true };
  });
  app.post("/tickets/:id/messages/:channel/attachments", { preHandler: [app.authenticate] }, async (request) => ({ ok: true, channel: channelParams.parse(request.params).channel }));
}

function listMessages(ticketId: string, type: "CLIENT" | "INTERNAL") {
  return prisma.message.findMany({ where: { ticketId, type, deletedAt: null }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
}

async function createMessage(reply: FastifyReply, ticketId: string, userId: string, type: "CLIENT" | "INTERNAL", body: unknown) {
  const input = createMessageSchema.parse(body);
  const message = await prisma.message.create({ data: { ticketId, userId, type, content: input.content, readBy: [userId] } });
  return reply.code(201).send(message);
}
