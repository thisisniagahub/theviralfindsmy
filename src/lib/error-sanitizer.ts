/** Production error sanitization - strips implementation details from responses */

/**
 * Sanitize error response for production
 * In development: returns full error details
 * In production: returns generic error message only
 */
export function sanitizeError(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred'
): { error: string; details?: unknown } {
  if (process.env.NODE_ENV === 'development') {
    // Development: show full details
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: String(error) }
  }

  // Production: generic message only
  console.error('Production error:', error)
  return { error: defaultMessage }
}

/**
 * Sanitize validation errors
 * Strips Zod details in production
 */
export function sanitizeValidationError(
  error: unknown,
  defaultMessage: string = 'Validation failed'
): { error: string; details?: unknown } {
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: String(error) }
  }

  // Production: never show validation details
  return { error: defaultMessage }
}
