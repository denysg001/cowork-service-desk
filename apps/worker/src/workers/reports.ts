import type { Job } from "bullmq";
import { withLock } from "../services/locks.js";
import { logger } from "../logger.js";

type ReportJob = { reportId: string; correlationId: string };

export async function processReport(job: Job<ReportJob>) {
  await withLock(`worker:report:${job.data.reportId}`, 10 * 60_000, async () => {
    logger.info("report_generated", { reportId: job.data.reportId, correlationId: job.data.correlationId });
  });
}
