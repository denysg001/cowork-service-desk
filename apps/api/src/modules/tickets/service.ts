import type { Prisma, TicketStatus } from "@prisma/client";
import { createTicketSchema, makePageMeta, type CreateTicketInput, type UpdateTicketInput } from "@cowork/shared";
import { prisma } from "../../db/prisma.js";
import { badRequest, conflict, notFound } from "../../utils/errors.js";
import { makeEtag } from "../../utils/etag.js";
import type { CacheService } from "../../services/cache.js";

const validTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "PAUSED", "CLOSED"],
  IN_PROGRESS: ["PAUSED", "RESOLVED", "CLOSED"],
  PAUSED: ["IN_PROGRESS", "CLOSED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: []
};

export async function listTickets(input: { page: number; limit: number; status?: TicketStatus | undefined }, cache: CacheService | null) {
  const key = `tickets:list:${input.page}:${input.limit}:${input.status ?? "all"}`;
  const producer = async () => {
    const where: Prisma.TicketWhereInput = { deletedAt: null, ...(input.status ? { status: input.status } : {}) };
    const [total, data] = await prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.limit,
        take: input.limit
      })
    ]);
    return { data: data.map(toDto), meta: makePageMeta(input.page, input.limit, total, ["status ASC", "createdAt DESC", "id DESC"]) };
  };
  return cache ? cache.swr(key, 15, producer, 60) : producer();
}

export async function getTicket(id: string) {
  const ticket = await prisma.ticket.findFirst({ where: { id, deletedAt: null } });
  if (!ticket) throw notFound("Ticket");
  return { ticket: toDto(ticket), etag: makeEtag(ticket) };
}

export async function createTicket(input: CreateTicketInput, context: { userId: string; correlationId: string }, cache: CacheService | null) {
  const parsed = createTicketSchema.parse(input);
  const scope = `ticket:create:${context.userId}`;
  if (parsed.idempotencyKey) {
    const existing = await prisma.idempotencyKey.findUnique({ where: { key_scope: { key: parsed.idempotencyKey, scope } } });
    if (existing && existing.expiresAt > new Date()) return existing.response;
  }
  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
        location: parsed.location,
        requesterId: context.userId
      }
    });
    await tx.ticketEvent.create({
      data: { ticketId: ticket.id, actorId: context.userId, type: "ticket.created", payload: ticket, correlationId: context.correlationId }
    });
    await tx.auditLog.create({
      data: { actorId: context.userId, action: "create", entityType: "Ticket", entityId: ticket.id, after: ticket, correlationId: context.correlationId }
    });
    await tx.outboxEvent.create({
      data: { topic: "ticket.created", payload: { id: ticket.id }, correlationId: context.correlationId }
    });
    return toDto(ticket);
  });
  if (parsed.idempotencyKey) {
    await prisma.idempotencyKey.create({
      data: {
        key: parsed.idempotencyKey,
        scope,
        statusCode: 201,
        response: result,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }
  await cache?.delPattern("tickets:list:*");
  return result;
}

export async function updateTicket(id: string, input: UpdateTicketInput, context: { userId: string; correlationId: string }, cache: CacheService | null) {
  const current = await prisma.ticket.findFirst({ where: { id, deletedAt: null } });
  if (!current) throw notFound("Ticket");
  if (input.status && !validTransitions[current.status].includes(input.status)) {
    throw badRequest("Invalid ticket status transition", { from: current.status, to: input.status });
  }
  const updated = await prisma.$transaction(async (tx) => {
    const data: Prisma.TicketUpdateManyMutationInput = { version: { increment: 1 } };
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.status !== undefined) data.status = input.status;
    const result = await tx.ticket.updateMany({
      where: { id, version: input.version, deletedAt: null },
      data
    });
    if (result.count !== 1) throw conflict("Ticket version conflict", { expectedVersion: input.version });
    const next = await tx.ticket.findUniqueOrThrow({ where: { id } });
    await tx.ticketEvent.create({
      data: { ticketId: id, actorId: context.userId, type: "ticket.updated", payload: { before: current, after: next }, correlationId: context.correlationId }
    });
    await tx.auditLog.create({
      data: { actorId: context.userId, action: "update", entityType: "Ticket", entityId: id, before: current, after: next, correlationId: context.correlationId }
    });
    await tx.outboxEvent.create({ data: { topic: "ticket.updated", payload: { id }, correlationId: context.correlationId } });
    return next;
  });
  await cache?.delPattern("tickets:list:*");
  await cache?.del(`tickets:${id}`);
  return { dto: toDto(updated), etag: makeEtag(updated) };
}

export async function softDeleteTicket(id: string, context: { userId: string; correlationId: string }, cache: CacheService | null) {
  const result = await prisma.ticket.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date(), version: { increment: 1 } } });
  if (result.count !== 1) throw notFound("Ticket");
  await prisma.auditLog.create({ data: { actorId: context.userId, action: "soft_delete", entityType: "Ticket", entityId: id, correlationId: context.correlationId } });
  await cache?.delPattern("tickets:list:*");
  await cache?.del(`tickets:${id}`);
}

function toDto(ticket: {
  id: string;
  number: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  location: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}) {
  return {
    id: ticket.id,
    number: ticket.number,
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    location: ticket.location,
    version: ticket.version,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    deletedAt: ticket.deletedAt?.toISOString() ?? null
  };
}
