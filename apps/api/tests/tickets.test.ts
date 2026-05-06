import { describe, expect, it, vi } from "vitest";
import { updateTicket } from "../src/modules/tickets/service.js";
import { conflict } from "../src/utils/errors.js";

vi.mock("../src/db/prisma.js", () => ({
  prisma: {
    ticket: {
      findFirst: vi.fn(async () => ({
        id: "7a85c5fd-0203-49e1-8e4f-698197fcb639",
        number: 1,
        title: "AC",
        description: "Broken",
        priority: "HIGH",
        status: "CLOSED",
        location: "Room 1",
        version: 2,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        deletedAt: null
      })),
      updateMany: vi.fn(async () => ({ count: 0 })),
      findUniqueOrThrow: vi.fn()
    },
    ticketEvent: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    outboxEvent: { create: vi.fn() },
    $transaction: vi.fn(async (fn) => fn({
      ticket: {
        updateMany: vi.fn(async () => ({ count: 0 })),
        findUniqueOrThrow: vi.fn()
      },
      ticketEvent: { create: vi.fn() },
      auditLog: { create: vi.fn() },
      outboxEvent: { create: vi.fn() }
    }))
  }
}));

describe("tickets", () => {
  it("rejects invalid transitions before writing", async () => {
    await expect(updateTicket("7a85c5fd-0203-49e1-8e4f-698197fcb639", { version: 2, status: "OPEN" }, { userId: "u", correlationId: "c" }, null)).rejects.toMatchObject({
      code: "BAD_REQUEST"
    });
  });

  it("uses optimistic locking conflicts", async () => {
    await expect(updateTicket("7a85c5fd-0203-49e1-8e4f-698197fcb639", { version: 1, title: "New title" }, { userId: "u", correlationId: "c" }, null)).rejects.toMatchObject(
      conflict("Ticket version conflict", { expectedVersion: 1 })
    );
  });
});
