import { nanoid } from "nanoid";
import { redis } from "../redis.js";

const releaseScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

export async function withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
  const token = nanoid();
  const lockKey = `lock:${key}`;
  const ok = await redis.set(lockKey, token, "PX", ttlMs, "NX");
  if (ok !== "OK") return null;
  try {
    return await fn();
  } finally {
    await redis.eval(releaseScript, 1, lockKey, token);
  }
}
