/**
 * Standardized API Route Handler Utilities
 * Wraps route handlers with consistent error handling
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
} from '@/lib/errors'
import { errorResponse, ErrorCodes } from '@/lib/api-response'
import { ZodError } from 'zod'

/**
 * Wrap a route handler with standardized error handling
 * Usage: export const GET = withErrorHandling(async (request, context) => { ... })
 */
export function withErrorHandling<T = unknown>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
): (request: NextRequest, context?: T) => Promise<NextResponse> {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error(`API Error [${request.method} ${request.url}]:`, error)

      // Handle known error types
      if (error instanceof ApiError) {
        return NextResponse.json(
          errorResponse(error.code, error.message),
          { status: error.statusCode }
        )
      }

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))
        return NextResponse.json(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            issues
          ),
          { status: 400 }
        )
      }

      // Handle generic errors
      if (error instanceof Error) {
        // Check for common error patterns
        const message = error.message.toLowerCase()

        if (message.includes('not found') || message.includes('404')) {
          return NextResponse.json(
            errorResponse(ErrorCodes.NOT_FOUND, error.message),
            { status: 404 }
          )
        }

        if (message.includes('unauthorized') || message.includes('401')) {
          return NextResponse.json(
            errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
            { status: 401 }
          )
        }

        if (message.includes('forbidden') || message.includes('403')) {
          return NextResponse.json(
            errorResponse(ErrorCodes.FORBIDDEN, error.message),
            { status: 403 }
          )
        }

        if (message.includes('conflict') || message.includes('409') || message.includes('already exists')) {
          return NextResponse.json(
            errorResponse(ErrorCodes.CONFLICT, error.message),
            { status: 409 }
          )
        }

        if (message.includes('database') || message.includes('prisma')) {
          return NextResponse.json(
            errorResponse(ErrorCodes.DATABASE_ERROR, 'Database error occurred'),
            { status: 503 }
          )
        }

        if (message.includes('timeout') || message.includes('abort')) {
          return NextResponse.json(
            errorResponse(ErrorCodes.SERVICE_UNAVAILABLE, 'Request timeout'),
            { status: 503 }
          )
        }

        // Default internal error
        return NextResponse.json(
          errorResponse(ErrorCodes.INTERNAL_ERROR, 'Internal server error'),
          { status: 500 }
        )
      }

      // Unknown error type
      return NextResponse.json(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
        { status: 500 }
      )
    }
  }
}

/**
 * Try to parse JSON from request with proper error handling
 */
export async function parseJsonBody<T = unknown>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json()
    return body as T
  } catch {
    throw new ValidationError('Invalid JSON in request body')
  }
}

/**
 * Try to parse JSON from request, returning null on failure
 */
export async function parseJsonBodySafe<T = unknown>(request: NextRequest): Promise<T | null> {
  try {
    const body = await request.json()
    return body as T
  } catch {
    return null
  }
}

// Re-export error classes for convenience
export {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
}

import { ZodSchema } from 'zod'

/**
 * Validate request body against Zod schema
 */
export async function validateBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const body = await parseJsonBody<unknown>(request)
  return schema.parse(body)
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery<T>(request: NextRequest, schema: ZodSchema<T>): T {
  const url = new URL(request.url)
  const params: Record<string, unknown> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return schema.parse(params)
}

/**
 * Validate route parameters against Zod schema
 */
export function validateParams<T>(params: Record<string, string | string[]>, schema: ZodSchema<T>): T {
  // Convert array params to single values for validation
  const normalized: Record<string, unknown> = {}
  Object.entries(params).forEach(([key, value]) => {
    normalized[key] = Array.isArray(value) ? value[0] : value
  })
  return schema.parse(normalized)
}
