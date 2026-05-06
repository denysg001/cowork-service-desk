import { Queue } from "bullmq";
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma.js";
import { redis } from "./redis.js";
import { logger } from "./logger.js";
import { defaultJobOptions, queueNames } from "./queues/names.js";
import { createObservedWorker } from "./workers/common.js";
import { processSla } from "./workers/sla.js";
import { processNotification } from "./workers/notifications.js";
import { processReport } from "./workers/reports.js";
import { processCleanup } from "./workers/cleanup.js";

const handles = [
  createObservedWorker(queueNames.sla, processSla, 1),
  createObservedWorker(queueNames.notifications, processNotification, 10),
  createObservedWorker(queueNames.reports, processReport, 2),
  createObservedWorker(queueNames.cleanup, processCleanup, 1)
];

const schedulers = Object.values(queueNames).map((name) => new Queue(name, { connection: redis, defaultJobOptions }));

async function scheduleRecurringJobs() {
  await schedulers[0]!.upsertJobScheduler("sla-every-minute", { every: 60_000 }, { name: "sla.scan", data: { correlationId: randomUUID() } });
  await schedulers[3]!.upsertJobScheduler("cleanup-hourly", { every: 60 * 60_000 }, { name: "cleanup.expired", data: { correlationId: randomUUID() } });
}

async function shutdown(signal: string) {
  logger.info("worker_shutdown_started", { signal });
  await Promise.allSettled([...handles.map((handle) => handle.close()), ...schedulers.map((queue) => queue.close()), prisma.$disconnect(), redis.quit()]);
  logger.info("worker_shutdown_complete", { signal });
  process.exit(0);
}

await prisma.$connect();
await scheduleRecurringJobs();
logger.info("workers_started");
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
