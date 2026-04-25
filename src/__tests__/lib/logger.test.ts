import { describe, it, expect } from 'vitest'
import { logger } from '@/lib/logger'

describe('Logger', () => {
  it('should be defined', () => {
    expect(logger).toBeDefined()
    expect(logger.info).toBeDefined()
    expect(logger.error).toBeDefined()
    expect(logger.warn).toBeDefined()
    expect(logger.debug).toBeDefined()
  })
})
