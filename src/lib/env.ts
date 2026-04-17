/** Environment variable validation — fail fast on missing config */

import { z } from 'zod'
import { EnvValidationError } from './errors'

const emptyStringToUndefined = (val: string | undefined) => val === '' ? undefined : val

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1).optional().transform(emptyStringToUndefined),
  NEXTAUTH_URL: z.string().url().optional().transform(emptyStringToUndefined),
  ADMIN_EMAIL: z.string().email().optional().transform(emptyStringToUndefined).default('admin@theviralfinds.my'),
  ADMIN_PASSWORD: z.string().min(1).optional().transform(emptyStringToUndefined),
  DEMO_MODE: z.enum(['true', 'false']).default('false'),
  OPENCLAW_GATEWAY_URL: z.string().url().optional().transform(emptyStringToUndefined).default('https://operator.gangniaga.my'),
  OPENCLAW_GATEWAY_TOKEN: z.string().optional(),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://127.0.0.1:3004'),
  DB_SERVICE_URL: z.string().url().default('http://127.0.0.1:3005'),
  DB_SERVICE_SECRET: z.string().min(1, 'DB_SERVICE_SECRET is required for database service authentication'),
  SHOPEE_API_KEY: z.string().optional(),
  SHOPEE_PARTNER_ID: z.string().optional(),
  SHOPEE_PARTNER_KEY: z.string().optional(),
  SHOPEE_SHOP_ID: z.string().optional(),
  SHOPEE_REGION: z.enum(['MY', 'SG', 'TH', 'VN', 'PH', 'ID', 'TW', 'BR', 'MX', 'CL', 'CO', 'AR']).default('MY'),
  SHOPEE_ACCESS_TOKEN: z.string().optional(),
  SHOPEE_REFRESH_TOKEN: z.string().optional(),
  SHOPEE_USE_SANDBOX: z.enum(['true', 'false']).default('false'),
  SHOPEE_AFFILIATE_APP_ID: z.string().optional(),
  SHOPEE_AFFILIATE_SECRET: z.string().optional(),
  OPENCLAW_WS_ENABLED: z.enum(['true', 'false']).default('true'),
  OPENCLAW_HOOKS_PATH: z.string().default('/hooks'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CDN_BASE_URL: z.string().url().optional(),
})

function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((e) => e.path.join('.'))
        .filter((v) => v !== '')
      console.error(`❌ Missing or invalid environment variables: ${missingVars.join(', ')}`)
      console.error('Please check your .env file and ensure all required variables are set.')
      throw new EnvValidationError(missingVars)
    }
    throw error
  }
}

export const env = validateEnv()

export type Env = z.infer<typeof envSchema>
