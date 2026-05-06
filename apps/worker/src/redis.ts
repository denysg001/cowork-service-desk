import { Redis } from "ioredis";
import { env } from "./config.js";
import { logger } from "./logger.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: env.REDIS_TIMEOUT_MS,
  connectionName: "cowork-worker"
});

redis.on("error", (error: Error) => logger.warn("redis_error", { error: error.message }));
