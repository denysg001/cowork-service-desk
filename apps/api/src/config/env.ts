import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  WEB_PUBLIC_URL: z.string().url().default("http://localhost:5173"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  SESSION_MAX_PER_USER: z.coerce.number().int().positive().default(5),
  COWORKING_TIMEZONE: z.string().default("America/Sao_Paulo"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  REDIS_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  SMTP_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  S3_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  UPLOAD_DIR: z.string().default("./uploads"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
export const corsOrigins = env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
export const isProduction = env.NODE_ENV === "production";
