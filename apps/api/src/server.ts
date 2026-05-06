import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";
import { buildApp } from "./app.js";
import { createRedisConnection } from "./services/redis.js";
import { CacheService } from "./services/cache.js";
import { logger } from "./utils/logger.js";
import { createSocketServer } from "./websocket/socket.js";

async function boot() {
  await prisma.$connect();
  const redis = createRedisConnection("api");
  const sub = createRedisConnection("api-socket-sub");
  let cache: CacheService | null = null;
  try {
    await Promise.all([redis.connect(), sub.connect()]);
    cache = new CacheService(redis);
  } catch (error) {
    logger.warn("redis_boot_degraded_api_continues_without_cache", { error });
  }
  const app = await buildApp({ redis, cache });
  await app.listen({ port: env.PORT ?? env.API_PORT, host: "0.0.0.0" });
  createSocketServer(app.server, redis, sub);
  logger.info("api_started", { port: env.API_PORT });

  const shutdown = async (signal: string) => {
    logger.info("shutdown_started", { signal });
    await app.close();
    await Promise.allSettled([redis.quit(), sub.quit(), prisma.$disconnect()]);
    logger.info("shutdown_complete", { signal });
    process.exit(0);
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

boot().catch((error) => {
  logger.error("boot_failed", { error });
  process.exit(1);
});
