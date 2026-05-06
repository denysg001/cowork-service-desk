import { describe, expect, it } from "vitest";
import { addBusinessHours, effectiveBusinessSeconds, slaStatus } from "../src/modules/sla/calculator.js";

const calendar = { timezone: "America/Sao_Paulo", startHour: 8, endHour: 18, holidays: [] };

describe("SLA calculator", () => {
  it("adds business hours ignoring weekends", () => {
    const fridayLate = new Date("2026-05-08T20:00:00.000Z");
    expect(addBusinessHours(fridayLate, 4, calendar).toISOString()).toContain("2026-05-11");
  });

  it("subtracts accumulated pauses", () => {
    const start = new Date("2026-05-06T12:00:00.000Z");
    const end = new Date("2026-05-06T14:00:00.000Z");
    expect(effectiveBusinessSeconds(start, end, 1800, calendar)).toBe(5400);
  });

  it("marks breached SLA", () => {
    expect(slaStatus({ createdAt: new Date("2026-05-06T11:00:00.000Z"), now: new Date("2026-05-06T18:00:00.000Z"), slaHours: 4, accumulatedPauseSeconds: 0, calendar })).toBe("BREACHED");
  });
});
