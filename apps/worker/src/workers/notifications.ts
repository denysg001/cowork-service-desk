import type { Job } from "bullmq";
import { logger } from "../logger.js";

type NotificationJob = { channel: "email" | "in_app"; to: string; subject: string; body: string; correlationId: string };

export async function processNotification(job: Job<NotificationJob>) {
  if (job.data.channel === "email") {
    await Promise.race([
      Promise.resolve(logger.info("email_notification_stubbed", { to: job.data.to, correlationId: job.data.correlationId })),
      timeout(5000)
    ]);
    return;
  }
  logger.info("in_app_notification_created", { to: job.data.to, correlationId: job.data.correlationId });
}

function timeout(ms: number) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("smtp_timeout")), ms));
}
