import type { Job } from "bullmq";
import { prisma } from "../prisma.js";
import { logger } from "../logger.js";

type CleanupJob = { correlationId: string };

export async function processCleanup(job: Job<CleanupJob>) {
  const expired = await prisma.idempotencyKey.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const sessions = await prisma.session.updateMany({ where: { expiresAt: { lt: new Date() }, revokedAt: null }, data: { revokedAt: new Date() } });
  logger.info("cleanup_done", { expiredIdempotencyKeys: expired.count, revokedSessions: sessions.count, correlationId: job.data.correlationId });
}
