import type { Redis } from "ioredis";
import { nanoid } from "nanoid";

const unlockScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

export class DistributedLockService {
  constructor(private readonly redis: Redis) {}

  async acquire(key: string, ttlMs: number): Promise<{ token: string; release: () => Promise<void> } | null> {
    const token = nanoid();
    const ok = await this.redis.set(`lock:${key}`, token, "PX", ttlMs, "NX");
    if (ok !== "OK") return null;
    return {
      token,
      release: async () => {
        await this.redis.eval(unlockScript, 1, `lock:${key}`, token);
      }
    };
  }
}
