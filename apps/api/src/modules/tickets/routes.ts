import { changeTicketStatusSchema, paginationQuerySchema, ticketStatusSchema, updateTicketSchema } from "@cowork/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CacheService } from "../../services/cache.js";
import { changeTicketStatus, createTicket, getTicket, listTickets, softDeleteTicket, updateTicket } from "./service.js";
import { prisma } from "../../db/prisma.js";

const listQuery = paginationQuerySchema.extend({ status: ticketStatusSchema.optional() });

export async function ticketRoutes(app: FastifyInstance, cache: CacheService | null) {
  app.get("/tickets", { preHandler: [app.authenticate] }, async (request) => {
    return listTickets(listQuery.parse(request.query), cache);
  });

  app.post("/tickets", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = await createTicket(request.body as never, { userId: request.user!.id, correlationId: request.correlationId }, cache);
    return reply.code(201).send(result);
  });

  app.get("/tickets/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const result = await getTicket(id);
    if (request.headers["if-none-match"] === result.etag) return reply.code(304).send();
    reply.header("etag", result.etag);
    return result.ticket;
  });

  app.patch("/tickets/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const result = await updateTicket(id, updateTicketSchema.parse(request.body), { userId: request.user!.id, correlationId: request.correlationId }, cache);
    reply.header("etag", result.etag);
    return result.dto;
  });

  app.patch("/tickets/:id/status", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const result = await changeTicketStatus(id, changeTicketStatusSchema.parse(request.body), { userId: request.user!.id, correlationId: request.correlationId }, cache);
    reply.header("etag", result.etag);
    return result.dto;
  });

  app.delete("/tickets/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    await softDeleteTicket(id, { userId: request.user!.id, correlationId: request.correlationId }, cache);
    return reply.code(204).send();
  });

  app.get("/tickets/:id/history", { preHandler: [app.authenticate] }, async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    return prisma.ticketHistory.findMany({ where: { ticketId: id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  });
}
