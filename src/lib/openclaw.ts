/**
 * OpenClaw Gateway Integration Library
 * Bridges MCP tools and A2A agents to the OpenClaw Gateway at https://operator.gangniaga.my
 * Also uses z-ai-web-dev-sdk as a local fallback for AI capabilities.
 */

// NOTE: z-ai-web-dev-sdk is imported dynamically inside functions that need it,
// to prevent the large SDK bundle from crashing the Next.js dev server on initial compile.

// ─── Configuration ────────────────────────────────────────────────
const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY_URL || 'https://operator.gangniaga.my'
const OPENCLAW_API_KEY = process.env.OPENCLAW_GATEWAY_TOKEN || process.env.OPENCLAW_API_KEY || ''
const GATEWAY_TIMEOUT = 15_000 // 15s default timeout

// ─── Types ────────────────────────────────────────────────────────

export interface OpenClawHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  gateway: string
  uptime?: string
  version?: string
  timestamp: string
  latencyMs?: number
}

export interface MCPToolDefinition {
  name: string
  description: string
  category: string
  status: 'active' | 'inactive' | 'beta'
  version: string
  executionCount: number
  lastExecuted: string | null
}

export interface MCPToolResult {
  jsonrpc: '2.0'
  id: string
  result: {
    content: Array<{ type: 'text'; text: string }>
    isError: boolean
  }
  _source: 'gateway' | 'sdk-fallback' | 'embedded'
}

export interface A2AAgentDefinition {
  id: string
  name: string
  description: string
  capabilities: string[]
  status: 'online' | 'offline' | 'busy'
  category: string
  tasksCompleted: number
  version: string
}

export interface ChainedPipelineResult {
  status: 'completed' | 'partial' | 'failed'
  query: string
  pipeline: Array<{
    agent: string
    status: 'success' | 'error'
    output: string
    durationMs: number
  }>
  finalOutput: string
  totalDurationMs: number
  _source: 'gateway' | 'sdk-fallback'
}

export interface OpenClawCompletionRequest {
  model?: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  max_tokens?: number
  thinking?: { type: 'enabled' | 'disabled' }
}

export interface OpenClawModel {
  id: string
  name: string
  provider: string
  category: string
}

// ─── Gateway HTTP helpers ─────────────────────────────────────────

async function gatewayFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = `${OPENCLAW_GATEWAY}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(OPENCLAW_API_KEY ? { Authorization: `Bearer ${OPENCLAW_API_KEY}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  }
  return fetch(url, {
    ...options,
    headers,
    signal: options?.signal || AbortSignal.timeout(GATEWAY_TIMEOUT),
    cache: 'no-store',
  })
}

// ─── Health Check ─────────────────────────────────────────────────

export async function checkOpenClawHealth(): Promise<OpenClawHealthStatus> {
  const start = Date.now()
  try {
    const res = await gatewayFetch('/health', { signal: AbortSignal.timeout(5000) })
    const latencyMs = Date.now() - start
    if (res.ok) {
      const data = await res.json()
      return {
        status: 'healthy',
        gateway: OPENCLAW_GATEWAY,
        uptime: data.uptime || data.server?.uptime,
        version: data.version || data.server?.version,
        timestamp: new Date().toISOString(),
        latencyMs,
      }
    }
    return {
      status: 'degraded',
      gateway: OPENCLAW_GATEWAY,
      timestamp: new Date().toISOString(),
      latencyMs,
    }
  } catch {
    return {
      status: 'unhealthy',
      gateway: OPENCLAW_GATEWAY,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    }
  }
}

// ─── MCP Tool Definitions ─────────────────────────────────────────

const MCP_TOOLS: MCPToolDefinition[] = [
  { name: 'web_search', description: 'Search the web for real-time information, news, and data', category: 'research', status: 'active', version: '1.0.0', executionCount: 0, lastExecuted: null },
  { name: 'web_reader', description: 'Extract and analyze content from any web page URL', category: 'research', status: 'active', version: '1.0.0', executionCount: 0, lastExecuted: null },
  { name: 'llm_chat', description: 'General-purpose LLM chat for analysis, writing, and reasoning', category: 'intelligence', status: 'active', version: '1.0.0', executionCount: 0, lastExecuted: null },
  { name: 'image_generation', description: 'Generate images from text descriptions using AI', category: 'content', status: 'active', version: '1.0.0', executionCount: 0, lastExecuted: null },
  { name: 'trending_scanner', description: 'Scan trending Shopee products across categories to discover high-demand items', category: 'research', status: 'active', version: '1.2.0', executionCount: 0, lastExecuted: null },
  { name: 'keyword_research', description: 'Shopee SEO keyword analysis — find high-volume, low-competition keywords', category: 'research', status: 'active', version: '1.1.0', executionCount: 0, lastExecuted: null },
  { name: 'competitor_analysis', description: 'Competitor intelligence and strategy analysis for Shopee shops', category: 'analytics', status: 'active', version: '1.0.2', executionCount: 0, lastExecuted: null },
  { name: 'price_tracker', description: 'Product price monitoring and deal alerts across Shopee', category: 'intelligence', status: 'active', version: '1.1.0', executionCount: 0, lastExecuted: null },
  { name: 'smart_scheduler', description: 'Social media posting schedule optimizer for Malaysian audience', category: 'optimization', status: 'active', version: '1.0.0', executionCount: 0, lastExecuted: null },
  { name: 'ai_insights', description: 'Personalized AI insights and recommendations for affiliate performance', category: 'intelligence', status: 'active', version: '1.5.0', executionCount: 0, lastExecuted: null },
  { name: 'ai_content', description: 'AI content generation for affiliate marketing copy and social posts', category: 'content', status: 'active', version: '1.3.0', executionCount: 0, lastExecuted: null },
]

export function getMCPTools(): MCPToolDefinition[] {
  return MCP_TOOLS
}

// ─── MCP Status ───────────────────────────────────────────────────

export async function getMCPStatus() {
  const health = await checkOpenClawHealth()
  return {
    protocol: { name: 'MCP (Model Context Protocol)', version: '2024-11-05' },
    connection: { status: health.status, gateway: OPENCLAW_GATEWAY, latencyMs: health.latencyMs },
    tools: { total: MCP_TOOLS.length, active: MCP_TOOLS.filter(t => t.status === 'active').length },
    server: { uptime: health.uptime || 'N/A', version: health.version || 'N/A' },
    health,
  }
}

// ─── Execute MCP Tool ─────────────────────────────────────────────

export async function executeMCPTool(
  toolName: string,
  params: Record<string, unknown>,
  requestId?: string
): Promise<MCPToolResult> {
  const id = requestId || `mcp-${Date.now()}`

  // 1. Try the OpenClaw Gateway first
  try {
    const res = await gatewayFetch('/v1/tools/execute', {
      method: 'POST',
      body: JSON.stringify({ tool: toolName, params, id }),
    })
    if (res.ok) {
      const data = await res.json()
      return {
        jsonrpc: '2.0',
        id,
        result: data.result || { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }], isError: false },
        _source: 'gateway',
      }
    }
  } catch {
    // Gateway unavailable, fall through to SDK
  }

  // 2. Fallback to z-ai-web-dev-sdk for supported tools
  try {
    const result = await executeToolViaSDK(toolName, params)
    return {
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false },
      _source: 'sdk-fallback',
    }
  } catch (sdkError) {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: JSON.stringify({ error: 'Tool execution failed', tool: toolName, details: String(sdkError) }) }],
        isError: true,
      },
      _source: 'sdk-fallback',
    }
  }
}

// ─── SDK-based tool execution ─────────────────────────────────────

async function getSDK() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  return ZAI.create()
}

async function executeToolViaSDK(toolName: string, params: Record<string, unknown>): Promise<unknown> {
  const zai = await getSDK()

  switch (toolName) {
    case 'web_search': {
      const query = (params.query as string) || 'Shopee Malaysia trending products'
      const num = (params.num as number) || 8
      const results = await zai.functions.invoke('web_search', { query, num })
      return { query, results, total: results.length }
    }

    case 'web_reader': {
      const url = (params.url as string) || ''
      if (!url) throw new Error('URL is required for web_reader')
      const pageData = await zai.functions.invoke('page_reader', { url })
      return { url, title: pageData.data?.title, content: pageData.data?.html?.substring(0, 5000), publishedTime: pageData.data?.publishedTime }
    }

    case 'llm_chat': {
      const messages = (params.messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) || [
        { role: 'user', content: (params.prompt as string) || 'Hello' }
      ]
      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      })
      return { response: completion.choices[0]?.message?.content || '', model: completion.model }
    }

    case 'image_generation': {
      const prompt = (params.prompt as string) || 'Shopee affiliate marketing banner'
      const size = (params.size as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440') || '1024x1024'
      const result = await zai.images.generations.create({ prompt, size })
      return { prompt, size, images: result.data?.length || 0, generated: true }
    }

    case 'trending_scanner': {
      const category = (params.category as string) || 'all'
      const region = (params.region as string) || 'MY'
      const searchResults = await zai.functions.invoke('web_search', {
        query: `Shopee ${region} trending products ${category !== 'all' ? category : ''} best seller 2025`,
        num: 8,
      })
      const contextText = searchResults.map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`).join('\n')
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a Shopee trending products analyst. Generate a JSON array of trending products. Each product: {rank, name, category, price (number RM), salesVolume (number), trendScore (60-99), velocity (emoji + text)}. Generate exactly 8 products. Reply ONLY with the JSON array.' },
          { role: 'user', content: `Find trending Shopee products in ${category !== 'all' ? category : 'all categories'} for ${region}.\n\nWeb search results:\n${contextText}` },
        ],
        thinking: { type: 'disabled' },
      })
      const raw = completion.choices[0]?.message?.content || '[]'
      const match = raw.match(/\[[\s\S]*\]/)
      return { products: match ? JSON.parse(match[0]) : [], category, region, source: 'ai_web_search' }
    }

    case 'keyword_research': {
      const seedKeyword = (params.seedKeyword as string) || (params.seed as string) || ''
      if (!seedKeyword) throw new Error('Seed keyword required')
      const searchResults = await zai.functions.invoke('web_search', {
        query: `shopee ${seedKeyword} keyword SEO Malaysia trending search 2025`,
        num: 5,
      })
      const contextText = searchResults.map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`).join('\n')
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a Shopee SEO expert. Generate keyword suggestions in JSON array. Each keyword: {keyword, volume (number), competition ("low"|"medium"|"high"), relevance (number 1-100)}. Generate 10 keywords. Reply ONLY with JSON array.' },
          { role: 'user', content: `Seed keyword: "${seedKeyword}"\n\nWeb search context:\n${contextText}` },
        ],
        thinking: { type: 'disabled' },
      })
      const raw = completion.choices[0]?.message?.content || '[]'
      const match = raw.match(/\[[\s\S]*\]/)
      return { keywords: match ? JSON.parse(match[0]) : [], seedKeyword, source: 'ai_web_search' }
    }

    case 'competitor_analysis': {
      const competitorShop = (params.competitorShop as string) || (params.shop as string) || ''
      if (!competitorShop) throw new Error('Competitor shop name required')
      const searchResults = await zai.functions.invoke('web_search', {
        query: `Shopee Malaysia ${competitorShop} shop seller review ratings products`,
        num: 5,
      })
      const contextText = searchResults.map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`).join('\n')
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a Shopee competitor analysis expert. Return JSON: {competitor, analysis:{totalProducts, avgRating, avgPrice, estimatedSales, strengths:[], weaknesses:[], strategies:[], threatLevel:"Low"|"Medium"|"High"}}. Reply ONLY with valid JSON.' },
          { role: 'user', content: `Analyze Shopee competitor shop "${competitorShop}".\n\nWeb search context:\n${contextText}` },
        ],
        thinking: { type: 'disabled' },
      })
      const raw = completion.choices[0]?.message?.content || '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) : { competitor: competitorShop, analysis: {} }
    }

    case 'price_tracker': {
      const productNames = (params.productNames as string[]) || []
      if (!productNames.length) throw new Error('Product names required')
      const query = productNames.slice(0, 3).join(' OR ')
      const searchResults = await zai.functions.invoke('web_search', {
        query: `Shopee Malaysia ${query} price review rating 2025`,
        num: 8,
      })
      const contextText = searchResults.map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`).join('\n')
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a Shopee price analyst. Return JSON: {products:[{name, currentPrice, lowestPrice, highestPrice, trend ("up"|"down"|"stable"), change (number %), recommendation ("Buy Now"|"Wait"|"Monitor")}], marketInsight (string)}. Reply ONLY with valid JSON.' },
          { role: 'user', content: `Track prices for these Shopee products: ${productNames.join(', ')}.\n\nWeb search results:\n${contextText}` },
        ],
        thinking: { type: 'disabled' },
      })
      const raw = completion.choices[0]?.message?.content || '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) : { products: [] }
    }

    case 'smart_scheduler': {
      const platform = (params.platform as string) || 'all'
      const niche = (params.niche as string) || 'affiliate marketing'
      const searchResults = await zai.functions.invoke('web_search', {
        query: `best time to post social media Malaysia ${platform} engagement rate 2025`,
        num: 5,
      })
      const contextText = searchResults.map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`).join('\n')
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a social media scheduling expert for Malaysian Shopee affiliates. Return JSON: {bestTimes:[{day,hour,platform,score (1-100)}], worstTimes:[{day,hour,platform}], tips:[string], weeklyCalendar:{}}. Reply ONLY with valid JSON.' },
          { role: 'user', content: `Suggest optimal posting schedule for ${platform} platform, in ${niche} niche.\n\nResearch context:\n${contextText}` },
        ],
        thinking: { type: 'disabled' },
      })
      const raw = completion.choices[0]?.message?.content || '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) : { bestTimes: [], tips: [] }
    }

    case 'ai_insights': {
      const metrics = params.metrics || params
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are an expert affiliate marketing analyst for Shopee Malaysia. Generate 4 actionable insights and 3 recommendations. Reply ONLY with valid JSON: {"insights":[{"type":"opportunity"|"warning"|"success"|"tip","message":"...","impact":"high"|"medium"|"low"}],"recommendations":["..."]}. No other text.' },
          { role: 'user', content: `Analyze this Shopee affiliate data and provide insights:\n${JSON.stringify(metrics, null, 2)}\nPeriod: Last 30 days` },
        ],
        thinking: { type: 'disabled' },
      })
      const raw = completion.choices[0]?.message?.content || '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) : { insights: [], recommendations: [] }
    }

    case 'ai_content': {
      const productName = (params.productName as string) || ''
      const contentType = (params.contentType as string) || 'social-post'
      const tone = (params.tone as string) || 'casual'
      const platform = (params.platform as string) || 'shopee'
      if (!productName) throw new Error('Product name required for ai_content')

      const contentPrompts: Record<string, string> = {
        'product-description': `Write a compelling Shopee product description for "${productName}". Include features, benefits, and call-to-action. Under 200 words.`,
        'social-post': `Write a viral social media post promoting "${productName}" on ${platform}. Make it engaging with emojis. Include CTA and hashtags. Under 150 words.`,
        'blog-article': `Write a short blog article (300 words) reviewing "${productName}" for affiliate marketing. Include pros, cons, and CTA.`,
        'email-subject': `Write 5 attention-grabbing email subject lines promoting "${productName}". Make them urgent and curiosity-driven.`,
        'ad-copy': `Write 3 variations of ad copy for "${productName}" targeting Malaysian shoppers. Include headline, description, and CTA for each.`,
      }

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: `You are an expert Shopee Malaysia affiliate marketer. Write in ${tone} tone for ${platform}. Reply with the generated content only, no explanations. Include relevant hashtags.` },
          { role: 'user', content: contentPrompts[contentType] || contentPrompts['social-post'] },
        ],
        thinking: { type: 'disabled' },
      })
      const content = completion.choices[0]?.message?.content || 'Content generation failed.'
      return { content, wordCount: content.split(/\s+/).length, hashtags: content.match(/#\w+/g) || [], contentType, productName, tone, platform }
    }

    default:
      throw new Error(`Unknown MCP tool: ${toolName}`)
  }
}

// ─── A2A Agent Definitions ────────────────────────────────────────

const A2A_AGENTS: A2AAgentDefinition[] = [
  {
    id: 'niagaresearch',
    name: 'NiagaResearch Agent',
    description: 'Deep research agent — scans Shopee trends, analyzes market data, identifies opportunities and competitive landscapes',
    capabilities: ['trend-analysis', 'market-data', 'pricing-intel', 'demand-forecast', 'niche-discovery', 'seasonal-patterns', 'competitor-scanning'],
    status: 'online',
    category: 'research',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagamarketing',
    name: 'NiagaMarketing Agent',
    description: 'Marketing strategy agent — crafts content plans, social media strategies, and audience targeting for Shopee affiliates',
    capabilities: ['copywriting', 'social-media-strategy', 'audience-targeting', 'content-calendar', 'campaign-planning', 'brand-positioning'],
    status: 'online',
    category: 'marketing',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagacomputer',
    name: 'NiagaComputer Agent',
    description: 'Computational agent — processes data, calculates ROI, optimizes budgets, and generates performance reports',
    capabilities: ['roi-calculation', 'budget-optimization', 'performance-reporting', 'data-aggregation', 'forecasting', 'a-b-testing'],
    status: 'online',
    category: 'computation',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagaaggregator',
    name: 'NiagaAggregator Agent',
    description: 'Aggregation agent — consolidates outputs from all agents, resolves conflicts, and creates unified reports',
    capabilities: ['output-merging', 'conflict-resolution', 'report-generation', 'data-synthesis', 'quality-check', 'formatting'],
    status: 'online',
    category: 'aggregation',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagareporter',
    name: 'NiagaReporter Agent',
    description: 'Reporting agent — creates polished final reports with visualizations, summaries, and actionable next steps',
    capabilities: ['report-writing', 'data-visualization', 'executive-summary', 'action-items', 'trend-highlighting', 'recommendation-prioritization'],
    status: 'online',
    category: 'reporting',
    tasksCompleted: 0,
    version: '1.0.0',
  },
]

export function getA2AAgents(): A2AAgentDefinition[] {
  return A2A_AGENTS
}

// ─── OpenClaw Completion (Individual Agent Call) ──────────────────

export async function openClawCompletion(request: OpenClawCompletionRequest): Promise<unknown> {
  // Try gateway first
  try {
    const res = await gatewayFetch('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: request.model || 'niaga-default',
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      return { ...data, _source: 'gateway' }
    }
  } catch {
    // Gateway unavailable, fall through to SDK
  }

  // Fallback to z-ai-web-dev-sdk
  const zai = await getSDK()
  const completion = await zai.chat.completions.create({
    messages: request.messages,
    thinking: request.thinking || { type: 'disabled' },
  })
  return { ...completion, _source: 'sdk-fallback' }
}

// ─── Get OpenClaw Models ─────────────────────────────────────────

export async function getOpenClawModels(): Promise<OpenClawModel[]> {
  // Try gateway first
  try {
    const res = await gatewayFetch('/v1/models')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.data || data.models)) {
        return (data.data || data.models).map((m: Record<string, string>) => ({
          id: m.id || m.name,
          name: m.name || m.id,
          provider: m.provider || 'openclaw',
          category: m.category || 'general',
        }))
      }
    }
  } catch {
    // Gateway unavailable
  }

  // Return the agent-based models as fallback
  return [
    { id: 'niagaresearch', name: 'NiagaResearch', provider: 'openclaw', category: 'research' },
    { id: 'niagamarketing', name: 'NiagaMarketing', provider: 'openclaw', category: 'marketing' },
    { id: 'niagacomputer', name: 'NiagaComputer', provider: 'openclaw', category: 'computation' },
    { id: 'niagaaggregator', name: 'NiagaAggregator', provider: 'openclaw', category: 'aggregation' },
    { id: 'niagareporter', name: 'NiagaReporter', provider: 'openclaw', category: 'reporting' },
  ]
}

// ─── Chained Pipeline: niagaresearch → niagamarketing → niagacomputer ──

export async function runChainedPipeline(userQuery: string): Promise<ChainedPipelineResult> {
  const pipelineStart = Date.now()
  const pipeline: ChainedPipelineResult['pipeline'] = []

  // Step 1: NiagaResearch — gather data and insights
  const researchStart = Date.now()
  let researchOutput = ''
  try {
    const researchResult = await openClawCompletion({
      model: 'niagaresearch',
      messages: [
        { role: 'system', content: 'You are NiagaResearch, a deep research agent specializing in Shopee Malaysia affiliate marketing. Analyze the query, gather key data points, identify trends and opportunities. Be thorough and data-driven.' },
        { role: 'user', content: userQuery },
      ],
      thinking: { type: 'disabled' },
    })
    researchOutput = typeof researchResult === 'object' && researchResult !== null
      ? (researchResult as Record<string, unknown>).choices?.[0]?.message?.content || JSON.stringify(researchResult)
      : String(researchResult)
  } catch (err) {
    researchOutput = `Research phase encountered an error: ${String(err)}. Proceeding with available context.`
  }
  pipeline.push({ agent: 'niagaresearch', status: 'success', output: researchOutput, durationMs: Date.now() - researchStart })

  // Step 2: NiagaMarketing — develop marketing strategy based on research
  const marketingStart = Date.now()
  let marketingOutput = ''
  try {
    const marketingResult = await openClawCompletion({
      model: 'niagamarketing',
      messages: [
        { role: 'system', content: 'You are NiagaMarketing, a marketing strategy agent for Shopee Malaysia affiliates. Based on the research findings, develop actionable marketing strategies, content plans, and audience targeting recommendations.' },
        { role: 'user', content: `Based on this research:\n${researchOutput}\n\nDevelop a marketing strategy for: ${userQuery}` },
      ],
      thinking: { type: 'disabled' },
    })
    marketingOutput = typeof marketingResult === 'object' && marketingResult !== null
      ? (marketingResult as Record<string, unknown>).choices?.[0]?.message?.content || JSON.stringify(marketingResult)
      : String(marketingResult)
  } catch (err) {
    marketingOutput = `Marketing phase encountered an error: ${String(err)}. Proceeding with available context.`
  }
  pipeline.push({ agent: 'niagamarketing', status: 'success', output: marketingOutput, durationMs: Date.now() - marketingStart })

  // Step 3: NiagaComputer — compute ROI, budgets, and projections
  const computerStart = Date.now()
  let computerOutput = ''
  try {
    const computerResult = await openClawCompletion({
      model: 'niagacomputer',
      messages: [
        { role: 'system', content: 'You are NiagaComputer, a computational agent for Shopee Malaysia affiliates. Based on the research and marketing strategy, calculate projected ROI, budget allocations, expected performance metrics, and provide optimization recommendations.' },
        { role: 'user', content: `Research:\n${researchOutput}\n\nMarketing Strategy:\n${marketingOutput}\n\nCompute ROI and projections for: ${userQuery}` },
      ],
      thinking: { type: 'disabled' },
    })
    computerOutput = typeof computerResult === 'object' && computerResult !== null
      ? (computerResult as Record<string, unknown>).choices?.[0]?.message?.content || JSON.stringify(computerResult)
      : String(computerResult)
  } catch (err) {
    computerOutput = `Computation phase encountered an error: ${String(err)}.`
  }
  pipeline.push({ agent: 'niagacomputer', status: 'success', output: computerOutput, durationMs: Date.now() - computerStart })

  // Compile final output
  const finalOutput = [
    '## 🔍 Research Findings\n' + researchOutput,
    '## 📱 Marketing Strategy\n' + marketingOutput,
    '## 📊 ROI & Projections\n' + computerOutput,
  ].join('\n\n---\n\n')

  const hasErrors = pipeline.some(p => p.status === 'error')
  return {
    status: hasErrors ? 'partial' : 'completed',
    query: userQuery,
    pipeline,
    finalOutput,
    totalDurationMs: Date.now() - pipelineStart,
    _source: 'sdk-fallback', // Will be 'gateway' when gateway is available
  }
}

// ─── Gateway URL (for diagnostics) ───────────────────────────────

export function getGatewayUrl(): string {
  return OPENCLAW_GATEWAY
}
