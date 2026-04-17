/**
 * Structured Logger
 * Provides consistent, structured logging with PII redaction
 * JSON output for production, human-readable for development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  requestId?: string
  [key: string]: unknown
}

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
  { pattern: /password[=:]\s*\S+/gi, replacement: 'password=[REDACTED]' },
  { pattern: /token[=:]\s*[a-zA-Z0-9_-]+/gi, replacement: 'token=[REDACTED]' },
  { pattern: /api[_-]?key[=:]\s*\S+/gi, replacement: 'api_key=[REDACTED]' },
  { pattern: /authorization[=:]\s*Bearer\s+\S+/gi, replacement: 'authorization=[REDACTED]' },
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CREDIT_CARD]' },
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
]

function redactSensitiveData(message: string): string {
  let redacted = message
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, replacement)
  }
  return redacted
}

function sanitizeContext(context?: LogContext): Record<string, unknown> | undefined {
  if (!context) return undefined

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'string') {
      sanitized[key] = redactSensitiveData(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = JSON.parse(redactSensitiveData(JSON.stringify(value)))
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const sanitizedContext = sanitizeContext(context)
    const redactedMessage = redactSensitiveData(message)

    const logEntry = {
      timestamp,
      level,
      message: redactedMessage,
      ...sanitizedContext,
    }

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry))
    } else {
      const colors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',   // green
        warn: '\x1b[33m',   // yellow
        error: '\x1b[31m',  // red
      }
      const reset = '\x1b[0m'
      console[level](
        `${colors[level]}[${timestamp}] [${level.toUpperCase()}]${reset}`,
        redactedMessage,
        sanitizedContext ? sanitizedContext : ''
      )
    }
  }

  debug(message: string, context?: LogContext) {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      this.log('debug', message, context)
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error ? redactSensitiveData(error.message) : undefined,
      stack: error?.stack,
    })
  }
}

export const logger = new Logger()
