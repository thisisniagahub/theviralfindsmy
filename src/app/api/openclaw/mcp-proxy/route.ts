import { NextRequest, NextResponse } from 'next/server'

/**
 * MCP Proxy Route — Lightweight status & tools endpoint
 * Heavy SDK operations (execute) are handled via dynamic imports only when POST is called
 */

export const maxDuration = 30
export const dynamic = 'force-dynamic'

const MCP_TOOLS = [
  { name: 'web_search', description: 'Search the web for real-time information, news, and data', category: 'research', status: 'active', version: '1.0.0' },
  { name: 'web_reader', description: 'Extract and analyze content from any web page URL', category: 'research', status: 'active', version: '1.0.0' },
  { name: 'llm_chat', description: 'General-purpose LLM chat for analysis, writing, and reasoning', category: 'intelligence', status: 'active', version: '1.0.0' },
  { name: 'image_generation', description: 'Generate images from text descriptions using AI', category: 'content', status: 'active', version: '1.0.0' },
  { name: 'trending_scanner', description: 'Scan trending Shopee products across categories to discover high-demand items', category: 'research', status: 'active', version: '1.2.0' },
  { name: 'keyword_research', description: 'Shopee SEO keyword analysis — find high-volume, low-competition keywords', category: 'research', status: 'active', version: '1.1.0' },
  { name: 'competitor_analysis', description: 'Competitor intelligence and strategy analysis for Shopee shops', category: 'analytics', status: 'active', version: '1.0.2' },
  { name: 'price_tracker', description: 'Product price monitoring and deal alerts across Shopee', category: 'intelligence', status: 'active', version: '1.1.0' },
  { name: 'smart_scheduler', description: 'Social media posting schedule optimizer for Malaysian audience', category: 'optimization', status: 'active', version: '1.0.0' },
  { name: 'ai_insights', description: 'Personalized AI insights and recommendations for affiliate performance', category: 'intelligence', status: 'active', version: '1.5.0' },
  { name: 'ai_content', description: 'AI content generation for affiliate marketing copy and social posts', category: 'content', status: 'active', version: '1.3.0' },
]

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
      // Try to discover real tools from OpenClaw Gateway
      const { checkOpenClawHealth, getMCPTools } = await import('@/lib/openclaw')
      const health = await checkOpenClawHealth()
      const tools = getMCPTools()

      return NextResponse.json({
        tools,
        total: tools.length,
        active: tools.filter(t => t.status === 'active').length,
        gateway: GATEWAY,
        gatewayStatus: health.status,
        gatewayLatencyMs: health.latencyMs,
        _source: health.status === 'healthy' ? 'openclaw-gateway-live' : 'openclaw-gateway-cached',
      })
    }

    if (path === '/plugins') {
      const plugins = [
        { name: 'Research Kit', version: '1.2.0', description: 'Web search, web reader, trending scanner, keyword research', tools: ['web_search', 'web_reader', 'trending_scanner', 'keyword_research'] },
        { name: 'Content Engine', version: '1.3.0', description: 'AI content generation and image generation', tools: ['ai_content', 'image_generation'] },
        { name: 'Analytics Suite', version: '1.0.1', description: 'Competitor analysis and price tracking', tools: ['competitor_analysis', 'price_tracker'] },
        { name: 'Optimization Hub', version: '1.1.0', description: 'Smart scheduling and AI insights', tools: ['smart_scheduler', 'ai_insights'] },
        { name: 'Intelligence Core', version: '1.5.0', description: 'LLM chat and AI insights', tools: ['llm_chat', 'ai_insights'] },
      ]
      return NextResponse.json({ plugins, totalPlugins: plugins.length, totalTools: MCP_TOOLS.length, _source: 'openclaw-gateway' })
    }

    return NextResponse.json({ message: 'MCP Proxy ready', gateway: GATEWAY, endpoints: ['/status', '/tools', '/plugins'] })
  } catch (error) {
    console.error('MCP proxy GET error:', error)
    return NextResponse.json({ error: 'MCP proxy request failed', details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path') || '/tools'
    const body = await request.json()

    // Dynamic import of heavy SDK only when actually executing tools
    const { executeMCPTool } = await import('@/lib/openclaw')

    const toolMatch = path.match(/\/tools\/(.+)\/execute/)
    if (toolMatch) {
      console.error(`[MCP] Executing tool "${toolMatch[1]}" via NiagaBot...`)
      const result = await executeMCPTool(toolMatch[1], body.params || body.arguments || {}, body.id)
      console.error(`[MCP] Tool "${toolMatch[1]}" completed. Source: ${result._source}`)
      return NextResponse.json(result)
    }

    if (path === '/execute' || path === '/tools/execute') {
      const toolName = body.tool || body.name || body.method
      if (!toolName) return NextResponse.json({ error: 'Tool name required' }, { status: 400 })
      console.error(`[MCP] Executing tool "${toolName}" via NiagaBot...`)
      const result = await executeMCPTool(toolName, body.params || body.arguments || {}, body.id)
      console.error(`[MCP] Tool "${toolName}" completed. Source: ${result._source}`)
      return NextResponse.json(result)
    }

    if (path === '/tools/call') {
      const toolName = body.name || body.method
      if (!toolName) return NextResponse.json({ error: 'Tool name required' }, { status: 400 })
      console.error(`[MCP] Executing tool "${toolName}" via NiagaBot...`)
      const result = await executeMCPTool(toolName, body.params || body.arguments || {}, body.id)
      console.error(`[MCP] Tool "${toolName}" completed. Source: ${result._source}`)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown MCP endpoint', path }, { status: 404 })
  } catch (error) {
    console.error('MCP proxy POST error:', error)
    return NextResponse.json({ error: 'MCP execution failed', details: String(error) }, { status: 500 })
  }
}
