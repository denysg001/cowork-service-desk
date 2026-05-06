import winston from "winston";

const sensitive = /(password|token|secret|authorization|cookie|refresh)/i;

function mask(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated-depth]";
  if (typeof value === "string") return value.length > 512 ? `${value.slice(0, 512)}...[truncated]` : value;
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => mask(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      sensitive.test(key) ? "[masked]" : mask(item, depth + 1)
    ])
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  defaultMeta: { service: "cowork-api" },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => JSON.stringify(mask(info)))
  ),
  transports: [new winston.transports.Console()]
});
