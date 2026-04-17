/**
 * Strict CORS origin validation
 * Prevents origin reflection vulnerabilities
 */

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Parse ALLOWED_ORIGINS from environment variable
 * Supports comma-separated list of origins and wildcard subdomains
 * Example: https://example.com,https://*.example.com
 */
function parseAllowedOrigins(): Set<string> {
  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]

  const envOrigins = process.env.ALLOWED_ORIGINS
  if (!envOrigins) {
    return new Set(defaultOrigins)
  }

  const origins = envOrigins.split(',').map(o => o.trim()).filter(Boolean)
  return new Set([...defaultOrigins, ...origins])
}

const ALLOWED_ORIGINS = parseAllowedOrigins()

/**
 * Convert wildcard pattern to regex
 * Example: https://*.example.com becomes /^https:\/\/[a-z0-9-]+\.example\.com$/i
 */
function wildcardToRegex(pattern: string): RegExp {
  // Escape special regex characters except *
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // Replace * with pattern for subdomain matching (alphanumeric and hyphens)
    .replace(/\*/g, '[a-z0-9-]+')
  return new RegExp(`^${escaped}$`, 'i')
}

/**
 * Validate origin against allowed origins
 * Supports exact matches and wildcard subdomain patterns
 * Rejects null origin in production
 */
export function validateOrigin(origin: string | null): { origin: string; allowed: boolean } {
  // Default fallback origin for development
  const defaultOrigin = 'http://localhost:3000'

  // Handle null origin
  if (!origin) {
    // In production, reject null origin (browser privacy mode or direct API calls)
    if (!isDev) {
      console.warn('[CORS] Rejecting null origin in production')
      return { origin: defaultOrigin, allowed: false }
    }
    return { origin: defaultOrigin, allowed: true }
  }

  // Check exact match first
  if (ALLOWED_ORIGINS.has(origin)) {
    return { origin, allowed: true }
  }

  // Check wildcard subdomain patterns
  for (const allowedOrigin of ALLOWED_ORIGINS) {
    if (allowedOrigin.includes('*')) {
      const regex = wildcardToRegex(allowedOrigin)
      if (regex.test(origin)) {
        return { origin, allowed: true }
      }
    }
  }

  // Log rejected origins for security monitoring
  console.warn(`[CORS] Origin rejected: ${origin}`)
  return { origin: defaultOrigin, allowed: false }
}

/**
 * Check if origin is explicitly allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return isDev // Only allow null in dev

  if (ALLOWED_ORIGINS.has(origin)) {
    return true
  }

  // Check wildcard patterns
  for (const allowedOrigin of ALLOWED_ORIGINS) {
    if (allowedOrigin.includes('*')) {
      const regex = wildcardToRegex(allowedOrigin)
      if (regex.test(origin)) {
        return true
      }
    }
  }

  return false
}
