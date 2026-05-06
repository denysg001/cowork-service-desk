import { describe, expect, it } from "vitest";
import { defaultJobOptions } from "../src/queues/names.js";

describe("queue defaults", () => {
  it("uses five exponential attempts", () => {
    expect(defaultJobOptions.attempts).toBe(5);
    expect(defaultJobOptions.backoff).toEqual({ type: "exponential", delay: 2000 });
    expect(defaultJobOptions.removeOnFail).toBe(false);
  });
});
