/** Environment variable validation — fail fast on missing config */
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  DEMO_MODE: z.enum(['true', 'false']).default('false'),
  SKIP_AUTH: z.enum(['true', 'false']).default('false'),
  OPENCLAW_GATEWAY_URL: z.string().url().default('https://operator.gangniaga.my'),
  OPENCLAW_GATEWAY_PROXY_URL: z.string().url().default('https://api.gangniaga.my/openclaw'),
  OPENCLAW_GATEWAY_TOKEN: z.string().optional(),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://127.0.0.1:3004'),
  DB_SERVICE_URL: z.string().url().default('http://127.0.0.1:3005'),
  SHOPEE_API_KEY: z.string().optional(),
})

let envParsed
try {
  envParsed = envSchema.parse(process.env)
} catch (error) {
  console.error('❌ Invalid environment variables:', error)
  throw new Error('Invalid environment variables')
}

export const env = envParsed
export type Env = z.infer<typeof envSchema>
