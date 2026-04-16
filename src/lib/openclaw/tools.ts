import { checkOpenClawHealth, gatewayFetch, getGatewayUrl, getSDK } from './gateway-client'
import { getGatewayWS } from './ws-client'

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

interface ToolDiscoveryCache {
  tools: MCPToolDefinition[]
  updatedAt: number
  source: 'gateway' | 'embedded'
}

interface GatewayInvokeResponse {
  ok?: boolean
  result?: unknown
  payload?: unknown
  error?: {
    type?: string
    message?: string
  }
}

interface SearchResult {
  name?: string
  snippet?: string
}

const TOOL_CACHE_TTL_MS = 5 * 60 * 1_000

const GATEWAY_TOOL_METADATA: Record<string, Pick<MCPToolDefinition, 'description' | 'category' | 'status' | 'version'>> = {
  web_search: { description: 'Search the web for live information and current results', category: 'research', status: 'active', version: '1.0.0' },
  web_fetch: { description: 'Fetch and extract a web page or remote resource', category: 'research', status: 'active', version: '1.0.0' },
  read: { description: 'Read files from the allowed workspace', category: 'filesystem', status: 'active', version: '1.0.0' },
  write: { description: 'Write files in the allowed workspace', category: 'filesystem', status: 'active', version: '1.0.0' },
  edit: { description: 'Edit existing files with patch operations', category: 'filesystem', status: 'active', version: '1.0.0' },
  exec: { description: 'Execute commands in the gateway runtime', category: 'runtime', status: 'active', version: '1.0.0' },
  browser: { description: 'Open and automate browser workflows', category: 'ui', status: 'active', version: '1.0.0' },
  'llm-task': { description: 'Run delegated LLM tasks inside OpenClaw', category: 'intelligence', status: 'active', version: '1.0.0' },
  memory_search: { description: 'Search indexed memory entries', category: 'memory', status: 'active', version: '1.0.0' },
  memory_get: { description: 'Fetch a stored memory record by identifier', category: 'memory', status: 'active', version: '1.0.0' },
  message: { description: 'Send outbound channel messages', category: 'messaging', status: 'active', version: '1.0.0' },
  nodes: { description: 'Inspect and interact with connected nodes', category: 'nodes', status: 'active', version: '1.0.0' },
  sessions_history: { description: 'Read bounded session history', category: 'sessions', status: 'active', version: '1.0.0' },
  sessions_list: { description: 'List visible OpenClaw sessions', category: 'sessions', status: 'active', version: '1.0.0' },
  session_status: { description: 'Inspect current or target session status', category: 'sessions', status: 'active', version: '1.0.0' },
  sessions_send: { description: 'Send a message to another session', category: 'sessions', status: 'active', version: '1.0.0' },
  sessions_spawn: { description: 'Spawn an isolated sub-agent session', category: 'sessions', status: 'active', version: '1.0.0' },
  agents_list: { description: 'List registered agents visible to the current session', category: 'agents', status: 'active', version: '1.0.0' },
  process: { description: 'Inspect runtime process state', category: 'runtime', status: 'active', version: '1.0.0' },
  gateway: { description: 'Inspect gateway state and automation helpers', category: 'automation', status: 'active', version: '1.0.0' },
  cron: { description: 'Manage scheduled tasks and cron jobs', category: 'automation', status: 'active', version: '1.0.0' },
  canvas: { description: 'Interact with the OpenClaw canvas surface', category: 'ui', status: 'active', version: '1.0.0' },
}

const SDK_COMPAT_TOOLS: Record<string, Pick<MCPToolDefinition, 'description' | 'category' | 'status' | 'version'>> = {
  web_reader: { description: 'Extract and analyze content from a web page URL', category: 'research', status: 'active', version: '1.0.0' },
  llm_chat: { description: 'Run a general-purpose chat completion via SDK fallback', category: 'intelligence', status: 'active', version: '1.0.0' },
  image_generation: { description: 'Generate images from text prompts', category: 'content', status: 'active', version: '1.0.0' },
  trending_scanner: { description: 'Analyze trending Shopee products and categories', category: 'research', status: 'active', version: '1.2.0' },
  keyword_research: { description: 'Research Shopee SEO keywords for Malaysian audiences', category: 'research', status: 'active', version: '1.1.0' },
  competitor_analysis: { description: 'Analyze competitor stores and affiliate positioning', category: 'analytics', status: 'active', version: '1.0.2' },
  price_tracker: { description: 'Track product prices and buying opportunities', category: 'intelligence', status: 'active', version: '1.1.0' },
  smart_scheduler: { description: 'Suggest optimal posting schedules for Malaysian audiences', category: 'optimization', status: 'active', version: '1.0.0' },
  ai_insights: { description: 'Generate affiliate performance insights and recommendations', category: 'intelligence', status: 'active', version: '1.5.0' },
  ai_content: { description: 'Generate Shopee-focused content and marketing copy', category: 'content', status: 'active', version: '1.3.0' },
}

const FALLBACK_TOOL_LIST: MCPToolDefinition[] = [
  ...Object.entries(GATEWAY_TOOL_METADATA),
  ...Object.entries(SDK_COMPAT_TOOLS),
].reduce<MCPToolDefinition[]>((tools, [name, metadata]) => {
  if (tools.some((tool) => tool.name === name)) {
    return tools
  }

  tools.push({
    name,
    description: metadata.description,
    category: metadata.category,
    status: metadata.status,
    version: metadata.version,
    executionCount: 0,
    lastExecuted: null,
  })

  return tools
}, [])

const toolCache: ToolDiscoveryCache = {
  tools: FALLBACK_TOOL_LIST,
  updatedAt: 0,
  source: 'embedded',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return JSON.stringify({ value: String(value) }, null, 2)
  }
}

function normalizeToolName(rawName: unknown): string | null {
  return typeof rawName === 'string' && rawName.trim() ? rawName.trim() : null
}

function createToolDefinition(name: string, partial: Partial<MCPToolDefinition> = {}): MCPToolDefinition {
  const metadata = GATEWAY_TOOL_METADATA[name] || SDK_COMPAT_TOOLS[name]

  return {
    name,
    description: partial.description || metadata?.description || `OpenClaw tool: ${name}`,
    category: partial.category || metadata?.category || 'general',
    status: partial.status || metadata?.status || 'active',
    version: partial.version || metadata?.version || '1.0.0',
    executionCount: partial.executionCount || 0,
    lastExecuted: partial.lastExecuted || null,
  }
}

function collectToolDefinitions(payload: unknown, collected = new Map<string, MCPToolDefinition>()): Map<string, MCPToolDefinition> {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      collectToolDefinitions(item, collected)
    }
    return collected
  }

  if (!isRecord(payload)) {
    return collected
  }

  const directName = normalizeToolName(payload.name) || normalizeToolName(payload.tool) || normalizeToolName(payload.id)
  if (directName) {
    collected.set(directName, createToolDefinition(directName, {
      description: typeof payload.description === 'string' ? payload.description : undefined,
      category: typeof payload.category === 'string' ? payload.category : undefined,
      status: payload.status === 'inactive' || payload.status === 'beta' ? payload.status : 'active',
      version: typeof payload.version === 'string' ? payload.version : undefined,
    }))
  }

  for (const nested of Object.values(payload)) {
    if (nested !== payload) {
      collectToolDefinitions(nested, collected)
    }
  }

  return collected
}

function extractGatewayError(payload: GatewayInvokeResponse | null): string {
  const message = payload?.error?.message
  const type = payload?.error?.type
  if (message && type) {
    return `${type}: ${message}`
  }

  return message || 'Gateway tool invocation failed'
}

function buildMcpSuccess(id: string, payload: unknown, source: MCPToolResult['_source']): MCPToolResult {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      content: [{ type: 'text', text: safeStringify(payload) }],
      isError: false,
    },
    _source: source,
  }
}

function buildMcpError(id: string, toolName: string, error: unknown): MCPToolResult {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      content: [{
        type: 'text',
        text: safeStringify({
          error: 'Tool execution failed',
          tool: toolName,
          details: error instanceof Error ? error.message : String(error),
        }),
      }],
      isError: true,
    },
    _source: 'sdk-fallback',
  }
}

function recordToolExecution(toolName: string) {
  const tool = toolCache.tools.find((item) => item.name === toolName)
  if (!tool) {
    return
  }

  tool.executionCount += 1
  tool.lastExecuted = new Date().toISOString()
}

export function getMCPTools(): MCPToolDefinition[] {
  return toolCache.tools
}

export async function discoverTools(forceRefresh = false): Promise<MCPToolDefinition[]> {
  if (!forceRefresh && toolCache.updatedAt > 0 && Date.now() - toolCache.updatedAt < TOOL_CACHE_TTL_MS) {
    return toolCache.tools
  }

  try {
    const gatewayWS = getGatewayWS()
    const discoveredPayload = await gatewayWS.rpc<unknown>('tools.effective', {
      sessionKey: 'main',
    })

    const collected = collectToolDefinitions(discoveredPayload)
    for (const [name] of Object.entries(SDK_COMPAT_TOOLS)) {
      if (!collected.has(name)) {
        collected.set(name, createToolDefinition(name))
      }
    }

    const tools = Array.from(collected.values()).sort((left, right) => left.name.localeCompare(right.name))
    if (tools.length > 0) {
      toolCache.tools = tools
      toolCache.updatedAt = Date.now()
      toolCache.source = 'gateway'
      return tools
    }
  } catch {
    // Fall back to the last known cache below.
  }

  toolCache.tools = FALLBACK_TOOL_LIST
  toolCache.updatedAt = Date.now()
  toolCache.source = 'embedded'
  return toolCache.tools
}

export async function getMCPStatus() {
  const health = await checkOpenClawHealth()
  const tools = await discoverTools()

  return {
    protocol: { name: 'MCP (Model Context Protocol)', version: '2024-11-05' },
    connection: {
      status: health.status,
      gateway: getGatewayUrl(),
      latencyMs: health.latencyMs,
    },
    tools: {
      total: tools.length,
      active: tools.filter((tool) => tool.status === 'active').length,
    },
    server: {
      uptime: health.uptime || 'N/A',
      version: health.version || 'N/A',
    },
    health,
  }
}

export async function invokeGatewayTool(
  tool: string,
  args: Record<string, unknown> = {},
  sessionKey?: string
): Promise<unknown> {
  const payloadArgs = { ...args }
  const action = typeof payloadArgs.action === 'string' ? payloadArgs.action : undefined
  const invokeSessionKey = sessionKey || (typeof payloadArgs.sessionKey === 'string' ? payloadArgs.sessionKey : undefined)

  if ('action' in payloadArgs) {
    delete payloadArgs.action
  }

  if ('sessionKey' in payloadArgs) {
    delete payloadArgs.sessionKey
  }

  const response = await gatewayFetch('/tools/invoke', {
    method: 'POST',
    body: JSON.stringify({
      tool,
      ...(action ? { action } : {}),
      args: payloadArgs,
      ...(invokeSessionKey ? { sessionKey: invokeSessionKey } : {}),
      dryRun: false,
    }),
  }, {
    sessionKey: invokeSessionKey,
  })

  const payload = await response.json() as GatewayInvokeResponse
  if (!response.ok || payload.ok === false) {
    throw new Error(extractGatewayError(payload))
  }

  return payload.result ?? payload.payload ?? payload
}

export async function executeMCPTool(
  toolName: string,
  params: Record<string, unknown>,
  requestId?: string
): Promise<MCPToolResult> {
  const id = requestId || `mcp-${Date.now()}`

  try {
    const result = await invokeGatewayTool(
      toolName,
      params,
      typeof params.sessionKey === 'string' ? params.sessionKey : undefined
    )

    recordToolExecution(toolName)
    return buildMcpSuccess(id, result, 'gateway')
  } catch (gatewayError) {
    try {
      const result = await executeToolViaSDK(toolName, params)
      recordToolExecution(toolName)
      return buildMcpSuccess(id, result, 'sdk-fallback')
    } catch (sdkError) {
      const gatewayMessage = gatewayError instanceof Error ? gatewayError.message : String(gatewayError)
      const sdkMessage = sdkError instanceof Error ? sdkError.message : String(sdkError)

      return buildMcpError(id, toolName, new Error(
        `Gateway execution failed and SDK fallback also failed. Gateway: ${gatewayMessage}. Fallback: ${sdkMessage}`
      ))
    }
  }
}

async function executeToolViaSDK(toolName: string, params: Record<string, unknown>): Promise<unknown> {
  const zai = await getSDK()

  switch (toolName) {
    case 'web_search': {
      const query = typeof params.query === 'string' ? params.query : 'Shopee Malaysia trending products'
      const num = typeof params.num === 'number' ? params.num : 8
      const results = await zai.functions.invoke('web_search', { query, num }) as SearchResult[]
      return { query, results, total: results.length }
    }

    case 'web_reader': {
      const url = typeof params.url === 'string' ? params.url : ''
      if (!url) {
        throw new Error('URL is required for web_reader')
      }

      const pageData = await zai.functions.invoke('page_reader', { url }) as {
        data?: {
          title?: string
          html?: string
          publishedTime?: string
        }
      }

      return {
        url,
        title: pageData.data?.title,
        content: pageData.data?.html?.slice(0, 5_000),
        publishedTime: pageData.data?.publishedTime,
      }
    }

    case 'llm_chat': {
      const inputMessages = Array.isArray(params.messages)
        ? params.messages.filter((message): message is { role: 'system' | 'user' | 'assistant'; content: string } => {
          return isRecord(message)
            && (message.role === 'system' || message.role === 'user' || message.role === 'assistant')
            && typeof message.content === 'string'
        })
        : []

      const messages = inputMessages.length > 0
        ? inputMessages
        : [{ role: 'user' as const, content: typeof params.prompt === 'string' ? params.prompt : 'Hello' }]

      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      }) as {
        choices?: Array<{ message?: { content?: string } }>
        model?: string
      }

      return {
        response: completion.choices?.[0]?.message?.content || '',
        model: completion.model,
      }
    }

    case 'image_generation': {
      const prompt = typeof params.prompt === 'string' ? params.prompt : 'Shopee affiliate marketing banner'
      const size = (typeof params.size === 'string' ? params.size : '1024x1024') as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440'
      const result = await zai.images.generations.create({ prompt, size }) as { data?: unknown[] }
      return { prompt, size, images: result.data?.length || 0, generated: true }
    }

    case 'trending_scanner': {
      const category = typeof params.category === 'string' ? params.category : 'all'
      const region = typeof params.region === 'string' ? params.region : 'MY'
      const searchResults = await zai.functions.invoke('web_search', {
        query: `Shopee ${region} trending products ${category !== 'all' ? category : ''} best seller 2025`,
        num: 8,
      }) as SearchResult[]

      const contextText = searchResults
        .map((result, index) => `${index + 1}. ${result.name}: ${result.snippet}`)
        .join('\n')

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a Shopee trending products analyst. Generate a JSON array of trending products. Each product: {rank, name, category, price (number RM), salesVolume (number), trendScore (60-99), velocity (emoji + text)}. Generate exactly 8 products. Reply ONLY with the JSON array.',
          },
          {
            role: 'user',
            content: `Find trending Shopee products in ${category !== 'all' ? category : 'all categories'} for ${region}.\n\nWeb search results:\n${contextText}`,
          },
        ],
        thinking: { type: 'disabled' },
      }) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const raw = completion.choices?.[0]?.message?.content || '[]'
      const match = raw.match(/\[[\s\S]*\]/)
      return {
        products: match ? JSON.parse(match[0]) as unknown[] : [],
        category,
        region,
        source: 'ai_web_search',
      }
    }

    case 'keyword_research': {
      const seedKeyword = typeof params.seedKeyword === 'string'
        ? params.seedKeyword
        : typeof params.seed === 'string'
          ? params.seed
          : ''

      if (!seedKeyword) {
        throw new Error('Seed keyword required')
      }

      const searchResults = await zai.functions.invoke('web_search', {
        query: `shopee ${seedKeyword} keyword SEO Malaysia trending search 2025`,
        num: 5,
      }) as SearchResult[]

      const contextText = searchResults
        .map((result, index) => `${index + 1}. ${result.name}: ${result.snippet}`)
        .join('\n')

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a Shopee SEO expert. Generate keyword suggestions in JSON array. Each keyword: {keyword, volume (number), competition ("low"|"medium"|"high"), relevance (number 1-100)}. Generate 10 keywords. Reply ONLY with JSON array.',
          },
          {
            role: 'user',
            content: `Seed keyword: "${seedKeyword}"\n\nWeb search context:\n${contextText}`,
          },
        ],
        thinking: { type: 'disabled' },
      }) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const raw = completion.choices?.[0]?.message?.content || '[]'
      const match = raw.match(/\[[\s\S]*\]/)
      return {
        keywords: match ? JSON.parse(match[0]) as unknown[] : [],
        seedKeyword,
        source: 'ai_web_search',
      }
    }

    case 'competitor_analysis': {
      const competitorShop = typeof params.competitorShop === 'string'
        ? params.competitorShop
        : typeof params.shop === 'string'
          ? params.shop
          : ''

      if (!competitorShop) {
        throw new Error('Competitor shop name required')
      }

      const searchResults = await zai.functions.invoke('web_search', {
        query: `Shopee Malaysia ${competitorShop} shop seller review ratings products`,
        num: 5,
      }) as SearchResult[]

      const contextText = searchResults
        .map((result, index) => `${index + 1}. ${result.name}: ${result.snippet}`)
        .join('\n')

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a Shopee competitor analysis expert. Return JSON: {competitor, analysis:{totalProducts, avgRating, avgPrice, estimatedSales, strengths:[], weaknesses:[], strategies:[], threatLevel:"Low"|"Medium"|"High"}}. Reply ONLY with valid JSON.',
          },
          {
            role: 'user',
            content: `Analyze Shopee competitor shop "${competitorShop}".\n\nWeb search context:\n${contextText}`,
          },
        ],
        thinking: { type: 'disabled' },
      }) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const raw = completion.choices?.[0]?.message?.content || '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) as unknown : { competitor: competitorShop, analysis: {} }
    }

    case 'price_tracker': {
      const productNames = Array.isArray(params.productNames)
        ? params.productNames.filter((name): name is string => typeof name === 'string')
        : []

      if (productNames.length === 0) {
        throw new Error('Product names required')
      }

      const query = productNames.slice(0, 3).join(' OR ')
      const searchResults = await zai.functions.invoke('web_search', {
        query: `Shopee Malaysia ${query} price review rating 2025`,
        num: 8,
      }) as SearchResult[]

      const contextText = searchResults
        .map((result, index) => `${index + 1}. ${result.name}: ${result.snippet}`)
        .join('\n')

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a Shopee price analyst. Return JSON: {products:[{name, currentPrice, lowestPrice, highestPrice, trend ("up"|"down"|"stable"), change (number %), recommendation ("Buy Now"|"Wait"|"Monitor")}], marketInsight (string)}. Reply ONLY with valid JSON.',
          },
          {
            role: 'user',
            content: `Track prices for these Shopee products: ${productNames.join(', ')}.\n\nWeb search results:\n${contextText}`,
          },
        ],
        thinking: { type: 'disabled' },
      }) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const raw = completion.choices?.[0]?.message?.content || '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) as unknown : { products: [] }
    }

    case 'smart_scheduler': {
      const platform = typeof params.platform === 'string' ? params.platform : 'all'
      const niche = typeof params.niche === 'string' ? params.niche : 'affiliate marketing'
      const searchResults = await zai.functions.invoke('web_search', {
        query: `best time to post social media Malaysia ${platform} engagement rate 2025`,
        num: 5,
      }) as SearchResult[]

      const contextText = searchResults
        .map((result, index) => `${index + 1}. ${result.name}: ${result.snippet}`)
        .join('\n')

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a social media scheduling expert for Malaysian Shopee affiliates. Return JSON: {bestTimes:[{day,hour,platform,score (1-100)}], worstTimes:[{day,hour,platform}], tips:[string], weeklyCalendar:{}}. Reply ONLY with valid JSON.',
          },
          {
            role: 'user',
            content: `Suggest optimal posting schedule for ${platform} platform, in ${niche} niche.\n\nResearch context:\n${contextText}`,
          },
        ],
        thinking: { type: 'disabled' },
      }) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const raw = completion.choices?.[0]?.message?.content || '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) as unknown : { bestTimes: [], tips: [] }
    }

    case 'ai_insights': {
      const metrics = params.metrics || params
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert affiliate marketing analyst for Shopee Malaysia. Generate 4 actionable insights and 3 recommendations. Reply ONLY with valid JSON: {"insights":[{"type":"opportunity"|"warning"|"success"|"tip","message":"...","impact":"high"|"medium"|"low"}],"recommendations":["..."]}. No other text.',
          },
          {
            role: 'user',
            content: `Analyze this Shopee affiliate data and provide insights:\n${JSON.stringify(metrics, null, 2)}\nPeriod: Last 30 days`,
          },
        ],
        thinking: { type: 'disabled' },
      }) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const raw = completion.choices?.[0]?.message?.content || '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) as unknown : { insights: [], recommendations: [] }
    }

    case 'ai_content': {
      const productName = typeof params.productName === 'string' ? params.productName : ''
      const contentType = typeof params.contentType === 'string' ? params.contentType : 'social-post'
      const tone = typeof params.tone === 'string' ? params.tone : 'casual'
      const platform = typeof params.platform === 'string' ? params.platform : 'shopee'

      if (!productName) {
        throw new Error('Product name required for ai_content')
      }

      const prompts: Record<string, string> = {
        'product-description': `Write a compelling Shopee product description for "${productName}". Include features, benefits, and call-to-action. Under 200 words.`,
        'social-post': `Write a viral social media post promoting "${productName}" on ${platform}. Make it engaging with emojis. Include CTA and hashtags. Under 150 words.`,
        'blog-article': `Write a short blog article (300 words) reviewing "${productName}" for affiliate marketing. Include pros, cons, and CTA.`,
        'email-subject': `Write 5 attention-grabbing email subject lines promoting "${productName}". Make them urgent and curiosity-driven.`,
        'ad-copy': `Write 3 variations of ad copy for "${productName}" targeting Malaysian shoppers. Include headline, description, and CTA for each.`,
      }

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert Shopee Malaysia affiliate marketer. Write in ${tone} tone for ${platform}. Reply with the generated content only, no explanations. Include relevant hashtags.`,
          },
          {
            role: 'user',
            content: prompts[contentType] || prompts['social-post'],
          },
        ],
        thinking: { type: 'disabled' },
      }) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const content = completion.choices?.[0]?.message?.content || 'Content generation failed.'
      return {
        content,
        wordCount: content.split(/\s+/).length,
        hashtags: content.match(/#\w+/g) || [],
        contentType,
        productName,
        tone,
        platform,
      }
    }

    default:
      throw new Error(`Unknown MCP tool: ${toolName}`)
  }
}
