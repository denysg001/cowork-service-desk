import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { unauthorized } from "../../utils/errors.js";

export async function login(email: string, password: string, meta: { ip?: string | undefined; userAgent?: string | undefined }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) throw unauthorized();
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthorized();
  const refreshToken = randomUUID();
  const refreshHash = hashRefresh(refreshToken);
  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.session.create({
      data: {
        userId: user.id,
        refreshHash,
        ipAddress: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        expiresAt: daysFromNow(30)
      }
    });
    const sessions = await tx.session.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    const overflow = sessions.slice(0, Math.max(0, sessions.length - env.SESSION_MAX_PER_USER));
    if (overflow.length) {
      await tx.session.updateMany({ where: { id: { in: overflow.map((item) => item.id) } }, data: { revokedAt: new Date() } });
    }
    return created;
  });
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens(user, session.id, refreshToken) };
}

export async function refresh(refreshToken: string, meta: { ip?: string | undefined; userAgent?: string | undefined }) {
  const refreshHash = hashRefresh(refreshToken);
  const current = await prisma.session.findFirst({
    where: { refreshHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true }
  });
  if (!current || current.user.deletedAt) throw unauthorized();
  const nextRefresh = randomUUID();
  const session = await prisma.$transaction(async (tx) => {
    await tx.session.update({ where: { id: current.id }, data: { revokedAt: new Date() } });
    return tx.session.create({
      data: {
        userId: current.userId,
        refreshHash: hashRefresh(nextRefresh),
        ipAddress: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        rotatedFromId: current.id,
        expiresAt: daysFromNow(30)
      }
    });
  });
  return tokens(current.user, session.id, nextRefresh);
}

export async function revokeSession(sessionId: string) {
  await prisma.session.updateMany({ where: { id: sessionId }, data: { revokedAt: new Date() } });
}

function tokens(user: { id: string; email: string; role: string }, sessionId: string, refreshToken: string) {
  const accessToken = jwt.sign({ type: "access", id: user.id, email: user.email, role: user.role, sessionId }, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m"
  });
  return { accessToken, refreshToken };
}

function hashRefresh(refreshToken: string) {
  return createHash("sha256").update(refreshToken).digest("hex");
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
