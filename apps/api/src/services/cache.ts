import type { Redis } from "ioredis";
import { logger } from "../utils/logger.js";
import { DistributedLockService } from "./locks.js";

type CacheEnvelope<T> = { value: T; expiresAt: number; staleUntil: number };

export class CacheService {
  private readonly locks: DistributedLockService;

  constructor(private readonly redis: Redis) {
    this.locks = new DistributedLockService(redis);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      const envelope = JSON.parse(raw) as CacheEnvelope<T>;
      return Date.now() <= envelope.staleUntil ? envelope.value : null;
    } catch (error) {
      logger.warn("cache_get_degraded", { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number, staleSeconds = ttlSeconds): Promise<void> {
    try {
      const now = Date.now();
      const envelope: CacheEnvelope<T> = {
        value,
        expiresAt: now + ttlSeconds * 1000,
        staleUntil: now + (ttlSeconds + staleSeconds) * 1000
      };
      await this.redis.set(key, JSON.stringify(envelope), "EX", ttlSeconds + staleSeconds + jitterSeconds());
    } catch (error) {
      logger.warn("cache_set_degraded", { key, error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.warn("cache_del_degraded", { key, error });
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      let cursor = "0";
      do {
        const [next, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = next;
        if (keys.length > 0) await this.redis.del(...keys);
      } while (cursor !== "0");
    } catch (error) {
      logger.warn("cache_del_pattern_degraded", { pattern, error });
    }
  }

  async swr<T>(key: string, ttlSeconds: number, producer: () => Promise<T>, staleSeconds = ttlSeconds): Promise<T> {
    const raw = await this.redis.get(key).catch(() => null);
    if (raw) {
      const envelope = JSON.parse(raw) as CacheEnvelope<T>;
      if (Date.now() <= envelope.expiresAt) return envelope.value;
      if (Date.now() <= envelope.staleUntil) {
        void this.recomputeWithLock(key, ttlSeconds, staleSeconds, producer);
        return envelope.value;
      }
    }
    const lock = await this.locks.acquire(`cache:${key}`, 5000).catch(() => null);
    if (!lock) {
      await sleep(100);
      const stale = await this.get<T>(key);
      if (stale !== null) return stale;
      return producer();
    }
    try {
      const value = await producer();
      await this.set(key, value, ttlSeconds, staleSeconds);
      return value;
    } finally {
      await lock.release().catch(() => undefined);
    }
  }

  private async recomputeWithLock<T>(key: string, ttlSeconds: number, staleSeconds: number, producer: () => Promise<T>) {
    const lock = await this.locks.acquire(`cache:${key}`, 5000).catch(() => null);
    if (!lock) return;
    try {
      await this.set(key, await producer(), ttlSeconds, staleSeconds);
    } catch (error) {
      logger.warn("cache_recompute_failed", { key, error });
    } finally {
      await lock.release().catch(() => undefined);
    }
  }
}

function jitterSeconds() {
  return Math.floor(Math.random() * 30);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
