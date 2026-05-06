import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../../db/prisma.js";

const paramsId = z.object({ id: z.string().uuid() });
const baseList = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });

export async function adminCrudRoutes(app: FastifyInstance) {
  app.get("/users", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request) => {
    const { page, limit } = baseList.parse(request.query);
    const [total, data] = await prisma.$transaction([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.findMany({ where: { deletedAt: null }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * limit, take: limit, select: { id: true, email: true, name: true, role: true, companyId: true, active: true, createdAt: true } })
    ]);
    return pageResult(data, page, limit, total);
  });

  app.get("/users/me", { preHandler: [app.authenticate] }, async (request) => prisma.user.findUniqueOrThrow({ where: { id: request.user!.id }, select: { id: true, email: true, name: true, role: true, companyId: true } }));
  app.post("/users", { preHandler: [app.requireRole("ADMIN")] }, async (request, reply) => {
    const input = z.object({ email: z.string().email(), name: z.string().min(2), role: z.enum(["CLIENT", "OPERATOR", "ADMIN"]), companyId: z.string().uuid().nullable().optional(), password: z.string().min(8) }).parse(request.body);
    return reply.code(201).send(await prisma.user.create({ data: { email: input.email, name: input.name, role: input.role, companyId: input.companyId ?? null, passwordHash: await bcrypt.hash(input.password, 12) } }));
  });
  app.get("/users/:id", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request) => prisma.user.findFirstOrThrow({ where: { id: paramsId.parse(request.params).id, deletedAt: null }, select: { id: true, email: true, name: true, role: true, companyId: true, active: true } }));
  app.patch("/users/:id", { preHandler: [app.requireRole("ADMIN")] }, async (request) => {
    const input = z.object({ email: z.string().email().optional(), name: z.string().min(2).optional(), role: z.enum(["CLIENT", "OPERATOR", "ADMIN"]).optional(), companyId: z.string().uuid().nullable().optional() }).parse(request.body);
    const data: Record<string, unknown> = {};
    if (input.email !== undefined) data.email = input.email;
    if (input.name !== undefined) data.name = input.name;
    if (input.role !== undefined) data.role = input.role;
    if (input.companyId !== undefined) data.companyId = input.companyId;
    return prisma.user.update({ where: { id: paramsId.parse(request.params).id }, data });
  });
  app.patch("/users/:id/toggle", { preHandler: [app.requireRole("ADMIN")] }, async (request) => toggle("user", paramsId.parse(request.params).id));
  app.patch("/users/me/password", { preHandler: [app.authenticate] }, async (request) => {
    const input = z.object({ password: z.string().min(8) }).parse(request.body);
    await prisma.user.update({ where: { id: request.user!.id }, data: { passwordHash: await bcrypt.hash(input.password, 12) } });
    return { ok: true };
  });

  app.get("/companies/:id/users", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request) => prisma.user.findMany({ where: { companyId: paramsId.parse(request.params).id, deletedAt: null }, orderBy: [{ name: "asc" }] }));
  app.get("/companies/:id/tickets", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request) => prisma.ticket.findMany({ where: { companyId: paramsId.parse(request.params).id, deletedAt: null }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }));

  registerEntity(app, "companies", "company", z.object({ name: z.string().min(2), document: z.string().optional() }), z.object({ name: z.string().min(2).optional(), document: z.string().nullable().optional() }));
  registerEntity(app, "categories", "category", z.object({ name: z.string().min(2), slaHours: z.number().int().positive() }), z.object({ name: z.string().min(2).optional(), slaHours: z.number().int().positive().optional() }));
  registerEntity(app, "suppliers", "supplier", z.object({ name: z.string().min(2), email: z.string().email().optional(), phone: z.string().optional() }), z.object({ name: z.string().min(2).optional(), email: z.string().email().nullable().optional(), phone: z.string().nullable().optional() }));
  registerEntity(app, "rooms", "room", z.object({ name: z.string().min(2), floor: z.string(), qrCode: z.string(), positionX: z.number(), positionY: z.number(), width: z.number(), height: z.number() }), z.object({ name: z.string().min(2).optional(), floor: z.string().optional(), positionX: z.number().optional(), positionY: z.number().optional(), width: z.number().optional(), height: z.number().optional() }));

  app.get("/rooms/map", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async () => prisma.room.findMany({ where: { deletedAt: null, active: true }, orderBy: [{ floor: "asc" }, { name: "asc" }] }));
  app.get("/rooms/:id/qrcode", { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request) => {
    const room = await prisma.room.findUniqueOrThrow({ where: { id: paramsId.parse(request.params).id } });
    return { roomId: room.id, qrCode: room.qrCode, url: `/ticket/new?room=${room.id}` };
  });
}

function registerEntity(app: FastifyInstance, route: string, model: string, createSchema: z.ZodTypeAny, updateSchema: z.ZodTypeAny) {
  const delegate = () => (prisma as unknown as Record<string, any>)[model];
  app.get(`/${route}`, { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request) => {
    const { page, limit } = baseList.parse(request.query);
    const [total, data] = await prisma.$transaction([
      delegate().count({ where: { deletedAt: null } }),
      delegate().findMany({ where: { deletedAt: null }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * limit, take: limit })
    ]);
    return pageResult(data, page, limit, total);
  });
  app.post(`/${route}`, { preHandler: [app.requireRole("ADMIN")] }, async (request, reply) => reply.code(201).send(await delegate().create({ data: createSchema.parse(request.body) })));
  app.get(`/${route}/:id`, { preHandler: [app.requireRole("ADMIN", "OPERATOR")] }, async (request) => delegate().findFirstOrThrow({ where: { id: paramsId.parse(request.params).id, deletedAt: null } }));
  app.patch(`/${route}/:id`, { preHandler: [app.requireRole("ADMIN")] }, async (request) => delegate().update({ where: { id: paramsId.parse(request.params).id }, data: updateSchema.parse(request.body) }));
  app.patch(`/${route}/:id/toggle`, { preHandler: [app.requireRole("ADMIN")] }, async (request) => toggle(model, paramsId.parse(request.params).id));
}

async function toggle(model: string, id: string) {
  const delegate = (prisma as unknown as Record<string, any>)[model];
  const current = await delegate.findUniqueOrThrow({ where: { id } });
  return delegate.update({ where: { id }, data: { active: !current.active } });
}

function pageResult<T>(data: T[], page: number, limit: number, total: number) {
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), order: ["createdAt DESC", "id DESC"] } };
}
