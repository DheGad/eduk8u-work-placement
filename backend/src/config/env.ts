import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file relative to the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Zod schema for all required and optional environment variables.
 * The application will exit immediately if any required variable is missing
 * or fails type coercion — this prevents silent misconfiguration.
 */
const envSchema = z.object({
  // ---- Application ----
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a numeric string').transform(Number).default('3000'),
  API_VERSION: z.string().min(1).default('v1'),

  // ---- PostgreSQL ----
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z
    .string()
    .regex(/^\d+$/, 'DB_PORT must be numeric')
    .transform(Number)
    .default('5432'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_SSL: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  DB_POOL_MIN: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('2'),
  DB_POOL_MAX: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('10'),

  // ---- JWT ----
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ---- Vultr Object Storage ----
  VULTR_ACCESS_KEY: z.string().min(1, 'VULTR_ACCESS_KEY is required'),
  VULTR_SECRET_KEY: z.string().min(1, 'VULTR_SECRET_KEY is required'),
  VULTR_BUCKET_NAME: z.string().min(1, 'VULTR_BUCKET_NAME is required'),
  VULTR_ENDPOINT: z.string().url('VULTR_ENDPOINT must be a valid URL'),
  VULTR_REGION: z.string().min(1, 'VULTR_REGION is required'),

  // ---- SMTP ----
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('587'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM: z.string().min(1, 'SMTP_FROM is required'),
  POSTMARK_SERVER_TOKEN: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().optional(),

  // ---- CORS / Frontend ----
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS is required'),

  // ---- Rate Limiting ----
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('900000'),
  RATE_LIMIT_MAX: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('100'),

  // ---- Logging ----
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),
});

// Type inferred from schema (post-transform)
export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

/**
 * Validated, type-safe environment configuration.
 * Import this object wherever env vars are needed — never access process.env directly.
 */
export const env: Env = parsed.data;
