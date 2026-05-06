export const queueNames = {
  sla: "sla",
  notifications: "notifications",
  reports: "reports",
  cleanup: "cleanup"
} as const;

export const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
  removeOnFail: false
};
