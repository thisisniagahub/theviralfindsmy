import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-handler'
import { successResponse } from '@/lib/api-response'

export const GET = withErrorHandling(async () => {
  return NextResponse.json(successResponse({ message: 'Hello, world!' }))
})
