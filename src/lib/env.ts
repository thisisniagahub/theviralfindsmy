/** Environment variable validation — fail fast on missing config */
import { z } from 'zod'

const envSchema = z.object({
  // ─── Core ──────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(8, 'NEXTAUTH_SECRET must be at least 8 characters'),
  NEXTAUTH_URL: z.string().url().optional(),

  // ─── Auth & Admin ──────────────────────────────────────────────
  ADMIN_PASSWORD: z.string().min(1).optional(),
  DEMO_MODE: z.enum(['true', 'false']).default('false'),

  // ─── OpenClaw / AI ────────────────────────────────────────────
  OPENCLAW_GATEWAY_URL: z.string().url().default('https://operator.gangniaga.my'),
  OPENCLAW_GATEWAY_TOKEN: z.string().optional(),

  // ─── Integrations ─────────────────────────────────────────────
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  SHOPEE_API_KEY: z.string().optional(),
  OFFICE_JOIN_KEY: z.string().min(8, 'OFFICE_JOIN_KEY must be at least 8 characters'),

  // ─── Microservices (local dev only) ───────────────────────────
  NOTIFICATION_SERVICE_URL: z.string().url().optional().default('http://127.0.0.1:3004'),
  DB_SERVICE_URL: z.string().url().optional().default('http://127.0.0.1:3005'),
  DB_SERVICE_API_KEY: z.string().min(1).default('tvf-internal-api-key-2024'),
})

let env: z.infer<typeof envSchema>
try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    const missing = (error as z.ZodError).issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('\n  ')
    console.error(`[env] Invalid environment variables:\n  ${missing}`)
    // In development, allow startup with warnings; in production, crash
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
    // Fallback: create a partial env with defaults
    env = envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-fallback-secret-key',
    })
  } else {
    throw error
  }
}

export type Env = z.infer<typeof envSchema>
export { env }
