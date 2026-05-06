import { QueueEvents, Worker, type Job } from "bullmq";
import { prisma } from "../prisma.js";
import { redis } from "../redis.js";
import { logger } from "../logger.js";

export function createObservedWorker<T>(queueName: string, processor: (job: Job<T>) => Promise<void>, concurrency: number) {
  const worker = new Worker<T>(queueName, processor, { connection: redis, concurrency, autorun: true });
  const events = new QueueEvents(queueName, { connection: redis });
  worker.on("completed", (job) => logger.info("job_completed", { queueName, jobId: job.id, correlationId: correlationId(job.data) }));
  worker.on("failed", async (job, error) => {
    logger.error("job_failed", { queueName, jobId: job?.id, error: error.message, attemptsMade: job?.attemptsMade });
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await prisma.deadLetterJob.create({
        data: {
          queue: queueName,
          jobId: String(job.id),
          name: job.name,
          payload: job.data as object,
          reason: error.message,
          correlationId: correlationId(job.data) ?? null
        }
      });
    }
  });
  return { worker, events, close: async () => Promise.allSettled([worker.close(), events.close()]) };
}

function correlationId(data: unknown) {
  return typeof data === "object" && data !== null && "correlationId" in data ? String(data.correlationId) : undefined;
}
