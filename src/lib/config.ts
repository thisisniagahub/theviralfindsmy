/**
 * Environment Variable Validation
 * Fail-fast on startup with descriptive error messages for missing required env vars.
 */

interface EnvRule {
  name: string
  required: boolean
  description: string
  example?: string
}

const ENV_RULES: EnvRule[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
    example: 'postgresql://user:pass@host:5432/theviralfinds',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'Secret key for NextAuth.js JWT encryption',
    example: 'openssl rand -base64 32',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'Base URL for NextAuth.js callbacks',
    example: 'http://localhost:3000',
  },
  {
    name: 'OPENCLAW_GATEWAY_URL',
    required: false,
    description: 'OpenClaw AI Gateway URL for NiagaBot integration',
    example: 'https://operator.gangniaga.my',
  },
  {
    name: 'OPENCLAW_GATEWAY_TOKEN',
    required: false,
    description: 'API token for OpenClaw Gateway authentication',
    example: 'your-gateway-token',
  },
  {
    name: 'NOTIFICATION_SERVICE_URL',
    required: false,
    description: 'Local notification microservice URL',
    example: 'http://127.0.0.1:3004',
  },
]

export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  for (const rule of ENV_RULES) {
    const value = process.env[rule.name]

    if (rule.required && !value) {
      errors.push(
        `[CRITICAL] ${rule.name} is required but not set. ${rule.description}. Example: ${rule.example || ''}`
      )
    } else if (!rule.required && !value) {
      warnings.push(
        `[OPTIONAL] ${rule.name} is not set. ${rule.description}. Example: ${rule.example || ''}`
      )
    }

    // Check for placeholder values
    if (value && (value.includes('your-') || value.includes('placeholder') || value.includes('change-me'))) {
      warnings.push(
        `[CONFIG] ${rule.name} appears to be a placeholder value. Please update with real credentials.`
      )
    }
  }

  // Demo mode warning
  if (process.env.DEMO_MODE === 'true') {
    warnings.push('[DEMO] DEMO_MODE is enabled — returning mock data for all API requests.')
  }

  // Skip auth warning
  if (process.env.SKIP_AUTH === 'true') {
    warnings.push('[SECURITY] SKIP_AUTH is enabled — authentication is bypassed. DO NOT use in production!')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// Run validation on module load (dev only)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  const result = validateEnv()
  if (result.warnings.length > 0) {
    console.warn('\n🔍 Environment Variable Warnings:')
    result.warnings.forEach(w => console.warn(`  ${w}`))
    console.warn('')
  }
  if (!result.valid) {
    console.error('\n❌ Environment Variable Errors:')
    result.errors.forEach(e => console.error(`  ${e}`))
    console.error(
      '\nFix these issues in your .env file before starting the application.\n'
    )
  }
}
