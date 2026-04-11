import { NextRequest, NextResponse } from 'next/server'
import {
  getA2AAgents,
  getGatewayUrl,
} from '@/lib/openclaw'

/**
 * A2A Proxy Route — Bridges agent-to-agent communication via OpenClaw Gateway
 */

async function getOpenClawLib() {
  return await import('@/lib/openclaw')
}

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || '/status'

  try {
    // GET /agents — Return list of OpenClaw agents
    if (path === '/agents') {
      const agents = getA2AAgents()
      let gatewayStatus = 'unknown'
      try {
        const { checkOpenClawHealth } = await getOpenClawLib()
        const health = await Promise.race([
          checkOpenClawHealth(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ])
        gatewayStatus = health.status
      } catch {
        gatewayStatus = 'unreachable'
      }

      return NextResponse.json({
        agents,
        total: agents.length,
        onlineAgents: agents.filter(a => a.status === 'online').length,
        gateway: getGatewayUrl(),
        gatewayStatus,
        _source: 'openclaw-gateway',
      })
    }

    // GET /status — Return A2A service status
    if (path === '/status') {
      let health
      try {
        const { checkOpenClawHealth } = await getOpenClawLib()
        health = await Promise.race([
          checkOpenClawHealth(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ])
      } catch {
        health = { status: 'unreachable', gateway: getGatewayUrl(), timestamp: new Date().toISOString() }
      }

      const agents = getA2AAgents()
      return NextResponse.json({
        service: 'A2A Agent Protocol (OpenClaw)',
        version: '2.0.0',
        status: health.status === 'healthy' ? 'running' : 'degraded',
        gateway: getGatewayUrl(),
        gatewayHealth: health,
        agentCount: agents.length,
        onlineAgents: agents.filter(a => a.status === 'online').length,
        pipelineAgents: ['niagaresearch', 'niagamarketing', 'niagacomputer'],
        _source: 'openclaw-gateway',
      })
    }

    // GET /models — Return available models
    if (path === '/models') {
      let models
      try {
        const { getOpenClawModels } = await getOpenClawLib()
        models = await Promise.race([
          getOpenClawModels(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ])
      } catch {
        models = [
          { id: 'niagaresearch', name: 'NiagaResearch', provider: 'openclaw', category: 'research' },
          { id: 'niagamarketing', name: 'NiagaMarketing', provider: 'openclaw', category: 'marketing' },
          { id: 'niagacomputer', name: 'NiagaComputer', provider: 'openclaw', category: 'computation' },
        ]
      }

      return NextResponse.json({
        models,
        total: models.length,
        _source: 'openclaw-gateway',
      })
    }

    // GET /conversations — Return empty
    if (path.startsWith('/conversations')) {
      return NextResponse.json({ conversations: [], _source: 'openclaw-gateway' })
    }

    // Default
    return NextResponse.json({
      message: 'A2A Proxy ready',
      gateway: getGatewayUrl(),
      endpoints: ['/agents', '/status', '/models', '/execute'],
    })
  } catch (error) {
    console.error('A2A proxy GET error:', error)
    return NextResponse.json({ error: 'A2A proxy request failed', details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path') || '/execute'
    const body = await request.json()
    const { runChainedPipeline, openClawCompletion } = await getOpenClawLib()

    // POST /execute — Execute chained or parallel pipeline
    if (path === '/execute' || path === '/orchestrate') {
      const userQuery = body.task || body.query || body.message || body.prompt || ''
      if (!userQuery) {
        return NextResponse.json({ error: 'Query/task is required. Send {task: "..."} in body.' }, { status: 400 })
      }

      const mode = body.mode || 'sequential' // 'sequential' or 'parallel'
      const { runChainedPipeline, runParallelPipeline } = await getOpenClawLib()

      const result = mode === 'parallel'
        ? await runParallelPipeline(userQuery)
        : await runChainedPipeline(userQuery)

      return NextResponse.json({ ...result, mode })
    }

    // POST /agents/{agentId}/message — Send message to individual agent
    const agentMatch = path.match(/\/agents\/(.+)\/message/)
    if (agentMatch) {
      const agentId = agentMatch[1]
      const agents = getA2AAgents()
      const agent = agents.find(a => a.id === agentId)

      if (!agent) {
        return NextResponse.json({ error: `Agent "${agentId}" not found`, availableAgents: agents.map(a => a.id) }, { status: 404 })
      }

      const message = body.message || body.content || body.task || ''
      if (!message) {
        return NextResponse.json({ error: 'Message content required' }, { status: 400 })
      }

      const agentSystemPrompts: Record<string, string> = {
        niagaresearch: 'You are NiagaResearch, a deep research agent specializing in Shopee Malaysia affiliate marketing. Analyze trends, gather data, and identify opportunities.',
        niagamarketing: 'You are NiagaMarketing, a marketing strategy agent for Shopee Malaysia affiliates. Develop actionable marketing strategies and content plans.',
        niagacomputer: 'You are NiagaComputer, a computational agent for Shopee Malaysia affiliates. Calculate ROI, optimize budgets, and generate performance projections.',
        niagaaggregator: 'You are NiagaAggregator, an aggregation agent. Consolidate outputs, resolve conflicts, and create unified reports.',
        niagareporter: 'You are NiagaReporter, a reporting agent. Create polished final reports with summaries and actionable next steps.',
      }

      const result = await openClawCompletion({
        model: agentId,
        messages: [
          { role: 'system', content: agentSystemPrompts[agentId] || `You are ${agent.name}. ${agent.description}` },
          { role: 'user', content: message },
        ],
        thinking: { type: 'disabled' },
      })

      const responseText = typeof result === 'object' && result !== null
        ? (result as Record<string, unknown>).choices?.[0]?.message?.content || JSON.stringify(result)
        : String(result)

      return NextResponse.json({
        agentId,
        agentName: agent.name,
        response: responseText,
        _source: (result as Record<string, string>)?._source || 'openclaw-gateway',
      })
    }

    // POST /pipeline — Alias for /execute
    if (path === '/pipeline') {
      const userQuery = body.task || body.query || body.message || ''
      if (!userQuery) {
        return NextResponse.json({ error: 'Query/task is required' }, { status: 400 })
      }

      const result = await runChainedPipeline(userQuery)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown A2A endpoint', path }, { status: 404 })
  } catch (error) {
    console.error('A2A proxy POST error:', error)
    return NextResponse.json({
      status: 'failed',
      error: 'A2A execution failed',
      details: String(error),
    }, { status: 500 })
  }
}
