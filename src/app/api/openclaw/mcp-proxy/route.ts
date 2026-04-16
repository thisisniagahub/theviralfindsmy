import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { requireAuth } from '@/lib/api-auth'

/**
 * MCP Proxy Route — Lightweight status & tools endpoint
 * Heavy SDK operations (execute) are handled via dynamic imports only when POST is called
 */

export const maxDuration = 30
export const dynamic = 'force-dynamic'

const GATEWAY = process.env.OPENCLAW_GATEWAY_URL || 'https://operator.gangniaga.my'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || '/status'

  try {
    if (path === '/status') {
      const { getMCPStatus } = await import('@/lib/openclaw')
      const status = await getMCPStatus()
      return NextResponse.json(status)
    }

    if (path === '/tools') {
      const {
        checkOpenClawHealth,
        discoverTools,
      } = await import('@/lib/openclaw')

      const [health, tools] = await Promise.all([
        checkOpenClawHealth(),
        discoverTools(),
      ])

      return NextResponse.json({
        tools,
        total: tools.length,
        active: tools.filter((tool) => tool.status === 'active').length,
        gateway: GATEWAY,
        gatewayStatus: health.status,
        gatewayLatencyMs: health.latencyMs,
        _source: health.status === 'healthy' ? 'openclaw-gateway-live' : 'openclaw-gateway-cached',
      })
    }

    if (path === '/plugins') {
      const { discoverTools } = await import('@/lib/openclaw')
      const tools = await discoverTools()

      const plugins = [
        { name: 'Research Kit', version: '1.2.0', description: 'Web search, web reader, trending scanner, keyword research', tools: ['web_search', 'web_reader', 'trending_scanner', 'keyword_research'] },
        { name: 'Content Engine', version: '1.3.0', description: 'AI content generation and image generation', tools: ['ai_content', 'image_generation'] },
        { name: 'Analytics Suite', version: '1.0.1', description: 'Competitor analysis and price tracking', tools: ['competitor_analysis', 'price_tracker'] },
        { name: 'Optimization Hub', version: '1.1.0', description: 'Smart scheduling and AI insights', tools: ['smart_scheduler', 'ai_insights'] },
        { name: 'Intelligence Core', version: '1.5.0', description: 'LLM chat and AI insights', tools: ['llm_chat', 'ai_insights'] },
      ]

      return NextResponse.json({
        plugins,
        totalPlugins: plugins.length,
        totalTools: tools.length,
        _source: 'openclaw-gateway',
      })
    }

    return NextResponse.json({
      message: 'MCP Proxy ready',
      gateway: GATEWAY,
      endpoints: ['/status', '/tools', '/plugins'],
    })
  } catch (error) {
    console.error('MCP proxy GET error:', error)
    return NextResponse.json({ error: 'MCP proxy request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // 1. Check auth
  const { auth, error } = await requireAuth()
  if (error) return error

  // 2. Check rate limit
  const rateLimited = await withRateLimit(request, RATE_LIMITS.ai)
  if (rateLimited) return rateLimited

  try {
    const path = request.nextUrl.searchParams.get('path') || '/execute'
    const body = await request.json()
    const { executeMCPTool } = await import('@/lib/openclaw')

    const toolMatch = path.match(/\/tools\/(.+)\/execute/)
    if (toolMatch) {
      const toolName = toolMatch[1]
      console.error(`[MCP] Executing tool "${toolName}" via NiagaBot...`)
      const result = await executeMCPTool(toolName, body.params || body.arguments || {}, body.id)
      console.error(`[MCP] Tool "${toolName}" completed. Source: ${result._source}`)
      return NextResponse.json(result)
    }

    if (path === '/execute' || path === '/tools/execute' || path === '/tools/call') {
      const toolName = body.tool || body.name || body.method
      if (!toolName) {
        return NextResponse.json({ error: 'Tool name required' }, { status: 400 })
      }

      console.error(`[MCP] Executing tool "${toolName}" via NiagaBot...`)
      const result = await executeMCPTool(toolName, body.params || body.arguments || {}, body.id)
      console.error(`[MCP] Tool "${toolName}" completed. Source: ${result._source}`)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown MCP endpoint', path }, { status: 404 })
  } catch (error) {
    console.error('MCP proxy POST error:', error)
    return NextResponse.json({ error: 'MCP execution failed' }, { status: 500 })
  }
}
