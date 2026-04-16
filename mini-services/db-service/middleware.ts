/**
 * DB Service Middleware — Auth, CORS, and error handling utilities
 */

const DB_SERVICE_SECRET = process.env.DB_SERVICE_SECRET || ''

if (!DB_SERVICE_SECRET) {
  console.error('DB_SERVICE_SECRET is required for security')
  console.error('Generate one with: openssl rand -base64 32')
  console.error('Add to .env: DB_SERVICE_SECRET=your-generated-secret')
  throw new Error('DB_SERVICE_SECRET is required for database service authentication')
}

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

export function json(data: unknown, status = 200, req?: Request): Response {
  let origin = 'http://localhost:3000'
  if (req) {
    const reqOrigin = req.headers.get('origin') || ''
    if (ALLOWED_ORIGINS.has(reqOrigin)) origin = reqOrigin
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export function checkAuth(req: Request): Response | null {
  const url = new URL(req.url)
  if (url.pathname === '/health') return null

  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (token !== DB_SERVICE_SECRET) {
    return json({ error: 'Unauthorized: Invalid or missing DB_SERVICE_SECRET' }, 401, req)
  }
  return null
}

export function getAuthenticatedUserId(req: Request): string | null {
  return req.headers.get('x-user-id')
}

export function stripUserIdFromBody(body: Record<string, unknown>): Record<string, unknown> {
  const { userId: _, ...cleanBody } = body
  return cleanBody
}

export async function getBody(req: Request): Promise<Record<string, unknown>> {
  try { return await req.json() } catch { return {} }
}

export function handleCors(req: Request): Response | null {
  const method = req.method
  if (method === 'OPTIONS') {
    const reqOrigin = req.headers.get('origin') || ''
    const origin = ALLOWED_ORIGINS.has(reqOrigin) ? reqOrigin : 'http://localhost:3000'
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }
  return null
}

export { DB_SERVICE_SECRET, ALLOWED_ORIGINS }
