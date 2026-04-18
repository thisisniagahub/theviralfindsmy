import { describe, it, expect } from 'vitest'
import { successResponse, errorResponse, paginatedResponse, ErrorCodes } from './api-response'

describe('api-response', () => {
  describe('successResponse', () => {
    it('should create a successful response with data', () => {
      const data = { user: 'test' }
      const response = successResponse(data)

      expect(response).toEqual({
        success: true,
        data
      })
    })

    it('should create a successful response with data and meta', () => {
      const data = { user: 'test' }
      const meta = { page: 1, limit: 10 }
      const response = successResponse(data, meta)

      expect(response).toEqual({
        success: true,
        data,
        meta
      })
    })
  })

  describe('errorResponse', () => {
    it('should create an error response', () => {
      const response = errorResponse(ErrorCodes.BAD_REQUEST, 'Invalid input')

      expect(response).toEqual({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          details: undefined
        }
      })
    })

    it('should create an error response with details', () => {
      const details = { field: 'email', issue: 'Required' }
      const response = errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', details)

      expect(response).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details
        }
      })
    })
  })

  describe('paginatedResponse', () => {
    it('should create a paginated response', () => {
      const items = [{ id: 1 }, { id: 2 }]
      const response = paginatedResponse(items, 2, 10, 25)

      expect(response).toEqual({
        success: true,
        data: items,
        meta: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3
        }
      })
    })
  })
})
