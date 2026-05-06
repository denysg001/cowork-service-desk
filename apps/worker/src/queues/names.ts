export const queueNames = {
  sla: "sla-check:v1",
  notifications: "notifications:v1",
  reports: "reports-jobs:v1",
  cleanup: "cleanup-jobs:v1"
} as const;

export const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
  removeOnFail: false
};
