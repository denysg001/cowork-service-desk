import { describe, expect, it, vi } from "vitest";
import { CacheService } from "../src/services/cache.js";

class MemoryRedis {
  data = new Map<string, string>();
  locks = new Set<string>();
  async get(key: string) { return this.data.get(key) ?? null; }
  async set(key: string, value: string, ...args: string[]) {
    if (args.includes("NX")) {
      if (this.locks.has(key)) return null;
      this.locks.add(key);
    }
    this.data.set(key, value);
    return "OK";
  }
  async del(...keys: string[]) { keys.forEach((key) => { this.data.delete(key); this.locks.delete(key); }); }
  async scan() { return ["0", []]; }
  async eval(_script: string, _count: number, key: string) { this.locks.delete(key); return 1; }
}

describe("CacheService", () => {
  it("prevents stampede with a redis lock", async () => {
    const redis = new MemoryRedis();
    const cache = new CacheService(redis as never);
    const producer = vi.fn(async () => "value");
    const [a, b] = await Promise.all([cache.swr("k", 1, producer), cache.swr("k", 1, producer)]);
    expect(a).toBe("value");
    expect(b).toBe("value");
    expect(producer).toHaveBeenCalledTimes(1);
  });
});
