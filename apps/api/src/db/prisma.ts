import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" }
  ]
});

prisma.$on("error", (event) => logger.error("prisma_error", { event }));
prisma.$on("warn", (event) => logger.warn("prisma_warn", { event }));
