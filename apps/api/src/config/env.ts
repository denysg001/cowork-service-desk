import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  PORT: z.coerce.number().int().positive().optional(),
  API_PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  WEB_PUBLIC_URL: z.string().url().default("http://localhost:5173"),
  FRONTEND_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32).optional(),
  REFRESH_SECRET: z.string().min(32).optional(),
  COOKIE_SECRET: z.string().min(32),
  SESSION_MAX_PER_USER: z.coerce.number().int().positive().default(5),
  COWORKING_TIMEZONE: z.string().default("America/Sao_Paulo"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(1048576),
  REDIS_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  SMTP_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  S3_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  UPLOAD_STORAGE: z.enum(["local", "s3"]).optional(),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().default(10),
  UPLOAD_ALLOWED_TYPES: z.string().default("image/jpeg,image/png,application/pdf"),
  UPLOAD_DIR: z.string().default("./uploads"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
export const corsOrigins = (env.CORS_ORIGINS || env.FRONTEND_URL || env.WEB_PUBLIC_URL).split(",").map((origin) => origin.trim()).filter(Boolean);
export const isProduction = env.NODE_ENV === "production";
