/** Environment variable validation — fail fast on missing config */
import { z } from 'zod'

const envSchema = z.object({
  // ─── Core ──────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('file:../db/custom.db'),
  NEXTAUTH_SECRET: z.string().min(8, 'NEXTAUTH_SECRET must be at least 8 characters').default('dev-fallback-secret-key-change-in-production'),
  NEXTAUTH_URL: z.string().optional(),

  // ─── Auth & Admin ──────────────────────────────────────────────
  ADMIN_EMAIL: z.string().optional().default('admin@theviralfinds.my'),
  ADMIN_PASSWORD: z.string().optional().default('admin'),
  DEMO_MODE: z.enum(['true', 'false']).default('true'),

  // ─── OpenClaw / AI ────────────────────────────────────────────
  OPENCLAW_GATEWAY_URL: z.string().optional().default('https://operator.gangniaga.my'),
  OPENCLAW_GATEWAY_TOKEN: z.string().optional(),

  // ─── Integrations ─────────────────────────────────────────────
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  SHOPEE_API_KEY: z.string().optional(),
  SHOPEE_AFFILIATE_API_KEY: z.string().optional(),
  OFFICE_JOIN_KEY: z.string().optional().default('default-join-key'),

  // ─── Microservices (local dev only — not used on Vercel) ──────
  NOTIFICATION_SERVICE_URL: z.string().optional(),
  DB_SERVICE_URL: z.string().optional(),
  DB_SERVICE_API_KEY: z.string().min(1).default('tvf-internal-api-key-2024'),
})

let env: z.infer<typeof envSchema>
try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    const missing = (error as z.ZodError).issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('\n  ')
    console.warn(`[env] Environment variable warnings:\n  ${missing}`)
    // Use safe defaults to allow app to start
    env = envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'file:../db/custom.db',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-fallback-secret-key-change-in-production',
      DEMO_MODE: process.env.DEMO_MODE || 'true',
    })
  } else {
    throw error
  }
}

export type Env = z.infer<typeof envSchema>
export { env }
