import type { Job } from "bullmq";
import { prisma } from "../prisma.js";
import { withLock } from "../services/locks.js";
import { logger } from "../logger.js";

type SlaJob = { correlationId: string };

export async function processSla(job: Job<SlaJob>) {
  await withLock("worker:sla:global", 90_000, async () => {
    const batch = await prisma.ticket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, deletedAt: null },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      take: 100
    });
    logger.info("sla_batch_processed", { count: batch.length, correlationId: job.data.correlationId });
  });
}
