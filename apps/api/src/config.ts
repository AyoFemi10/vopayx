import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  PORT:                   z.coerce.number().default(3001),
  APP_URL:                z.string().default('http://localhost:3001'),
  FRONTEND_URL:           z.string().default('http://localhost:3000'),

  DATABASE_URL:           z.string(),
  REDIS_URL:              z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET:      z.string().min(32),
  JWT_REFRESH_SECRET:     z.string().min(32),
  JWT_ACCESS_EXPIRES_IN:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  EMAIL_PROVIDER:         z.enum(['resend', 'brevo']).default('resend'),
  EMAIL_FROM:             z.string().default('noreply@vopay.com'),
  EMAIL_FROM_NAME:        z.string().default('VOPayX'),

  RESEND_API_KEY:         z.string().optional(),
  BREVO_API_KEY:          z.string().optional(),
  BREVO_SMTP_HOST:        z.string().optional(),
  BREVO_SMTP_PORT:        z.coerce.number().optional(),
  BREVO_SMTP_USER:        z.string().optional(),
  BREVO_SMTP_PASS:        z.string().optional(),

  FLUTTERWAVE_PUBLIC_KEY:    z.string().optional(),
  FLUTTERWAVE_SECRET_KEY:    z.string().optional(),
  FLUTTERWAVE_ENCRYPTION_KEY:z.string().optional(),
  FLUTTERWAVE_WEBHOOK_SECRET:z.string().optional(),
  FLUTTERWAVE_BASE_URL:      z.string().default('https://api.flutterwave.com/v3'),

  PAYSTACK_PUBLIC_KEY:    z.string().optional(),
  PAYSTACK_SECRET_KEY:    z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET:z.string().optional(),
  PAYSTACK_BASE_URL:      z.string().default('https://api.paystack.co'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
