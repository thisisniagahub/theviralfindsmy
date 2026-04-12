/** Environment variable validation — fail fast on missing config */

import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  DEMO_MODE: z.enum(['true', 'false']).default('false'),
  OPENCLAW_GATEWAY_URL: z.string().url().default('https://operator.gangniaga.my'),
  OPENCLAW_GATEWAY_TOKEN: z.string().optional(),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://127.0.0.1:3004'),
  DB_SERVICE_URL: z.string().url().default('http://127.0.0.1:3005'),
  SHOPEE_API_KEY: z.string().optional(),
})

function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((e) => e.path.join('.'))
        .join(', ')
      console.error(`❌ Missing or invalid environment variables: ${missingVars}`)
      console.error('Please check your .env file and ensure all required variables are set.')
      process.exit(1)
    }
    throw error
  }
}

export const env = validateEnv()

export type Env = z.infer<typeof envSchema>
