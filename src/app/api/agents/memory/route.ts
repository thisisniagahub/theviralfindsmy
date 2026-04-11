import { NextRequest, NextResponse } from 'next/server'
import { getAgentHistory, clearAgentMemory } from '@/lib/agent-memory'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  if (!agentId) {
    return NextResponse.json({ error: 'agentId query parameter is required' }, { status: 400 })
  }

  try {
    const history = await getAgentHistory(agentId, limit)
    return NextResponse.json({ agentId, history, total: history.length })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get agent history', details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json({ error: 'agentId query parameter is required' }, { status: 400 })
  }

  try {
    await clearAgentMemory(agentId)
    return NextResponse.json({ success: true, agentId, message: 'Agent memory cleared' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear agent memory', details: String(error) }, { status: 500 })
  }
}
