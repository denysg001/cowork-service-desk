import type { Prisma, TicketStatus } from "@prisma/client";
import { createTicketSchema, makePageMeta, type ChangeTicketStatusInput, type CreateTicketInput, type UpdateTicketInput } from "@cowork/shared";
import { prisma } from "../../db/prisma.js";
import { badRequest, conflict, notFound } from "../../utils/errors.js";
import { makeEtag } from "../../utils/etag.js";
import type { CacheService } from "../../services/cache.js";

const validTransitions: Record<TicketStatus, TicketStatus[]> = {
  NEW: ["TRIAGE", "CANCELLED"],
  TRIAGE: ["SCHEDULED", "IN_PROGRESS", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_CLIENT", "WAITING_SUPPLIER", "PAUSED", "RESOLVED", "CANCELLED"],
  WAITING_CLIENT: ["IN_PROGRESS", "CANCELLED"],
  WAITING_SUPPLIER: ["IN_PROGRESS", "CANCELLED"],
  PAUSED: ["IN_PROGRESS", "CANCELLED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  CANCELLED: []
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
        categoryId: parsed.categoryId,
        companyId: parsed.companyId ?? await resolveRequesterCompanyId(tx, context.userId),
        roomId: parsed.roomId ?? null,
        requesterId: context.userId
      }
    });
    await tx.ticketHistory.create({ data: { ticketId: ticket.id, userId: context.userId, action: "ticket.created", toStatus: ticket.status } });
    await tx.auditLog.create({
      data: { userId: context.userId, action: "create", entity: "Ticket", entityId: ticket.id, after: ticket, correlationId: context.correlationId }
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
  const updated = await prisma.$transaction(async (tx) => {
    const data: Prisma.TicketUncheckedUpdateManyInput = { version: { increment: 1 } };
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.roomId !== undefined) data.roomId = input.roomId;
    if (input.operatorId !== undefined) data.operatorId = input.operatorId;
    if (input.supplierId !== undefined) data.supplierId = input.supplierId;
    if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (input.diagnosis !== undefined) data.diagnosis = input.diagnosis;
    if (input.action !== undefined) data.action = input.action;
    if (input.validation !== undefined) data.validation = input.validation;
    if (input.conclusion !== undefined) data.conclusion = input.conclusion;
    const result = await tx.ticket.updateMany({
      where: { id, version: input.version, deletedAt: null },
      data
    });
    if (result.count !== 1) throw conflict("Ticket version conflict", { expectedVersion: input.version });
    const next = await tx.ticket.findUniqueOrThrow({ where: { id } });
    await tx.ticketHistory.create({
      data: { ticketId: id, userId: context.userId, action: "ticket.updated" }
    });
    await tx.auditLog.create({ data: { userId: context.userId, action: "update", entity: "Ticket", entityId: id, before: current, after: next, correlationId: context.correlationId } });
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
  await prisma.auditLog.create({ data: { userId: context.userId, action: "soft_delete", entity: "Ticket", entityId: id, correlationId: context.correlationId } });
  await cache?.delPattern("tickets:list:*");
  await cache?.del(`tickets:${id}`);
}

export async function changeTicketStatus(id: string, input: ChangeTicketStatusInput, context: { userId: string; correlationId: string }, cache: CacheService | null) {
  const current = await prisma.ticket.findFirst({ where: { id, deletedAt: null } });
  if (!current) throw notFound("Ticket");
  if (!validTransitions[current.status].includes(input.status)) throw badRequest("Invalid ticket status transition", { from: current.status, to: input.status });
  if (input.status === "CANCELLED" && !input.reason) throw badRequest("CANCELLED requires reason");
  if (input.status === "SCHEDULED" && !input.scheduledAt && !current.scheduledAt) throw badRequest("SCHEDULED requires scheduledAt");
  if (input.status === "RESOLVED" && !(input.diagnosis && input.action && input.validation && input.conclusion)) throw badRequest("RESOLVED requires diagnosis, action, validation and conclusion");
  const updated = await prisma.$transaction(async (tx) => {
    const data: Prisma.TicketUncheckedUpdateManyInput = { status: input.status, version: { increment: 1 } };
    if (input.scheduledAt) data.scheduledAt = new Date(input.scheduledAt);
    if (input.status === "PAUSED") data.slaPausedAt = new Date();
    if (current.status === "PAUSED" && current.slaPausedAt) {
      data.slaPausedAt = null;
      data.slaAccumulatedPause = { increment: Math.floor((Date.now() - current.slaPausedAt.getTime()) / 1000) };
    }
    if (input.status === "RESOLVED") {
      data.resolvedAt = new Date();
      data.diagnosis = input.diagnosis!;
      data.action = input.action!;
      data.validation = input.validation!;
      data.conclusion = input.conclusion!;
    }
    if (input.status === "CLOSED") data.closedAt = new Date();
    if (input.status === "CANCELLED") data.cancelledReason = input.reason!;
    const result = await tx.ticket.updateMany({ where: { id, version: input.version, deletedAt: null }, data });
    if (result.count !== 1) throw conflict("Ticket version conflict", { expectedVersion: input.version });
    const next = await tx.ticket.findUniqueOrThrow({ where: { id } });
    await tx.ticketHistory.create({ data: { ticketId: id, userId: context.userId, action: "ticket.status_changed", fromStatus: current.status, toStatus: next.status, reason: input.reason ?? null } });
    await tx.auditLog.create({ data: { userId: context.userId, action: "status_change", entity: "Ticket", entityId: id, before: current, after: next, correlationId: context.correlationId } });
    return next;
  });
  await cache?.delPattern("tickets:list:*");
  return { dto: toDto(updated), etag: makeEtag(updated) };
}

async function resolveRequesterCompanyId(tx: Prisma.TransactionClient, userId: string) {
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { companyId: true } });
  if (!user.companyId) throw badRequest("companyId is required for internal users creating a ticket");
  return user.companyId;
}

function toDto(ticket: {
  id: string;
  number: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  slaStatus: string;
  categoryId: string;
  companyId: string;
  roomId: string | null;
  requesterId: string;
  operatorId: string | null;
  supplierId: string | null;
  slaDeadline: Date | null;
  scheduledAt: Date | null;
  diagnosis: string | null;
  action: string | null;
  validation: string | null;
  conclusion: string | null;
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
    slaStatus: ticket.slaStatus,
    categoryId: ticket.categoryId,
    companyId: ticket.companyId,
    roomId: ticket.roomId,
    requesterId: ticket.requesterId,
    operatorId: ticket.operatorId,
    supplierId: ticket.supplierId,
    slaDeadline: ticket.slaDeadline?.toISOString() ?? null,
    scheduledAt: ticket.scheduledAt?.toISOString() ?? null,
    diagnosis: ticket.diagnosis,
    action: ticket.action,
    validation: ticket.validation,
    conclusion: ticket.conclusion,
    version: ticket.version,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    deletedAt: ticket.deletedAt?.toISOString() ?? null
  };
}
