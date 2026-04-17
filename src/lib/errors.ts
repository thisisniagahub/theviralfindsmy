/** Custom error class for environment validation failures */

export class EnvValidationError extends Error {
  public missingVars: string[]

  constructor(missingVars: string[]) {
    const message = `Environment validation failed: missing or invalid variables: ${missingVars.join(', ')}`
    super(message)
    this.name = 'EnvValidationError'
    this.missingVars = missingVars
  }
}

/** Base API error with HTTP status code */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict detected') {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMITED', 429)
    this.name = 'RateLimitError'
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database error') {
    super(message, 'DATABASE_ERROR', 503)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends ApiError {
  constructor(message: string = 'External service error') {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502)
    this.name = 'ExternalServiceError'
  }
}
