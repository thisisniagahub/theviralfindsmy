import { NextRequest, NextResponse } from 'next/server'
import { getAgentHistory, clearAgentMemory } from '@/lib/agent-memory'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  if (!agentId) {
    return NextResponse.json(
      errorResponse(ErrorCodes.VALIDATION_ERROR, 'agentId query parameter is required'),
      { status: 400 }
    )
  }

  try {
    const history = await getAgentHistory(agentId, limit) as Array<Record<string, unknown>>
    return NextResponse.json(successResponse({ agentId, history, total: history.length }))
  } catch (error) {
    console.error('Failed to get agent history:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get agent history'),
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json(
      errorResponse(ErrorCodes.VALIDATION_ERROR, 'agentId query parameter is required'),
      { status: 400 }
    )
  }

  try {
    await clearAgentMemory(agentId)
    return NextResponse.json(successResponse({ agentId, message: 'Agent memory cleared' }))
  } catch (error) {
    console.error('Failed to clear agent memory:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to clear agent memory'),
      { status: 500 }
    )
  }
}
