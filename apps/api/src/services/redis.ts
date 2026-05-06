import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export function createRedisConnection(service: string) {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    connectTimeout: env.REDIS_TIMEOUT_MS,
    commandTimeout: env.REDIS_TIMEOUT_MS,
    lazyConnect: true,
    connectionName: service
  });

  redis.on("error", (error: Error) => logger.warn("redis_error", { service, error: error.message }));
  redis.on("close", () => logger.warn("redis_closed", { service }));
  return redis;
}
