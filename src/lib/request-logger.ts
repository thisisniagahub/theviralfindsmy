/**
 * Request Logger
 * Utilities for logging HTTP requests with timing
 */

import { logger } from './logger'

interface RequestContext {
  userId?: string
  ip?: string
  userAgent?: string
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Log incoming request
 */
export function logRequest(req: Request, context?: RequestContext) {
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent: context?.userAgent || req.headers.get('user-agent'),
    ip: context?.ip,
    userId: context?.userId,
  })
}

/**
 * Log completed request
 */
export function logRequestComplete(
  req: Request,
  statusCode: number,
  durationMs: number,
  context?: RequestContext
) {
  const message = `${req.method} ${req.url} - ${statusCode} (${durationMs}ms)`
  const logContext = {
    method: req.method,
    url: req.url,
    statusCode,
    durationMs,
    userId: context?.userId,
    ip: context?.ip,
  }

  if (statusCode >= 500) {
    logger.error(message, undefined, logContext)
  } else if (statusCode >= 400) {
    logger.warn(message, logContext)
  } else {
    logger.info(message, logContext)
  }
}

/**
 * Log request error
 */
export function logRequestError(
  req: Request,
  error: Error,
  durationMs: number,
  context?: RequestContext
) {
  logger.error(
    `${req.method} ${req.url} failed after ${durationMs}ms`,
    error,
    {
      method: req.method,
      url: req.url,
      durationMs,
      userId: context?.userId,
      ip: context?.ip,
    }
  )
}
