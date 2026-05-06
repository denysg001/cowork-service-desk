import { z } from "zod";

export const env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  REDIS_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  SMTP_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  COWORKING_TIMEZONE: z.string().default("America/Sao_Paulo")
}).parse(process.env);
