/**
 * Structured logger backed by Pino with OTel trace correlation.
 */

import { trace } from '@opentelemetry/api'
import pino from 'pino'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  requestId?: string
  [key: string]: unknown
}

const SENSITIVE_PATTERNS = [
  { pattern: /password[=:]\s*\S+/gi, replacement: 'password=[REDACTED]' },
  { pattern: /token[=:]\s*[a-zA-Z0-9._-]+/gi, replacement: 'token=[REDACTED]' },
  { pattern: /api[_-]?key[=:]\s*\S+/gi, replacement: 'api_key=[REDACTED]' },
  { pattern: /authorization[=:]\s*Bearer\s+\S+/gi, replacement: 'authorization=[REDACTED]' },
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CREDIT_CARD]' },
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
]

function redactSensitiveData(input: string): string {
  let redacted = input
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, replacement)
  }
  return redacted
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactSensitiveData(value)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry))
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(nestedValue)
    }
    return sanitized
  }

  return value
}

function sanitizeContext(context?: LogContext): Record<string, unknown> | undefined {
  if (!context) {
    return undefined
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    const sanitizedValue = sanitizeValue(value)
    if (sanitizedValue !== undefined) {
      sanitized[key] = sanitizedValue
    }
  }

  return sanitized
}

const loggerInstance = pino({
  level: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true' ? 'debug' : 'info',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,traceId,spanId',
        },
      },
  mixin() {
    const span = trace.getActiveSpan()
    const spanContext = span?.spanContext()

    if (!spanContext) {
      return {}
    }

    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    }
  },
})

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const sanitizedContext = sanitizeContext(context)
    const redactedMessage = redactSensitiveData(message)

    if (sanitizedContext) {
      loggerInstance[level](sanitizedContext, redactedMessage)
      return
    }

    loggerInstance[level](redactedMessage)
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
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
      error: error ? sanitizeValue({ message: error.message, stack: error.stack }) : undefined,
    })
  }
}

export const logger = new Logger()
