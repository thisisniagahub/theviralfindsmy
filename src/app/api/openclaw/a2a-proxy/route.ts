import { NextRequest, NextResponse } from 'next/server'
import { getGatewayUrl } from '@/lib/openclaw'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { requireAuth } from '@/lib/api-auth'

/**
 * A2A Proxy Route — Bridges agent-to-agent communication via OpenClaw Gateway
 */

export const maxDuration = 60
export const dynamic = 'force-dynamic'

async function getOpenClawLib() {
  return await import('@/lib/openclaw')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractResponseText(result: unknown): string {
  if (typeof result === 'string') {
    return result
  }

  if (!isRecord(result)) {
    return JSON.stringify(result)
  }

  const choices = result.choices
  if (Array.isArray(choices) && isRecord(choices[0])) {
    const message = choices[0].message
    if (isRecord(message) && typeof message.content === 'string') {
      return message.content
    }
  }

  if (typeof result.response === 'string') {
    return result.response
  }

  if (typeof result.output === 'string') {
    return result.output
  }

  return JSON.stringify(result)
}

function extractResultSource(result: unknown): string {
  return isRecord(result) && typeof result._source === 'string'
    ? result._source
    : 'openclaw-gateway'
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || '/status'

  try {
    if (path === '/agents') {
      const { discoverAgents, checkOpenClawHealth } = await getOpenClawLib()
      const [agents, health] = await Promise.all([
        discoverAgents(),
        Promise.race([
          checkOpenClawHealth(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5_000)),
        ]).catch(() => ({
          status: 'unreachable',
          gateway: getGatewayUrl(),
          timestamp: new Date().toISOString(),
        })),
      ])

      return NextResponse.json({
        agents,
        total: agents.length,
        onlineAgents: agents.filter((agent) => agent.status === 'online').length,
        gateway: getGatewayUrl(),
        gatewayStatus: health.status,
        _source: 'openclaw-gateway',
      })
    }

    if (path === '/status') {
      const { discoverAgents, checkOpenClawHealth } = await getOpenClawLib()

      const [agents, health] = await Promise.all([
        discoverAgents(),
        Promise.race([
          checkOpenClawHealth(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5_000)),
        ]).catch(() => ({
          status: 'unreachable',
          gateway: getGatewayUrl(),
          timestamp: new Date().toISOString(),
        })),
      ])

      return NextResponse.json({
        service: 'A2A Agent Protocol (OpenClaw)',
        version: '2.0.0',
        status: health.status === 'healthy' ? 'running' : 'degraded',
        gateway: getGatewayUrl(),
        gatewayHealth: health,
        agentCount: agents.length,
        onlineAgents: agents.filter((agent) => agent.status === 'online').length,
        pipelineAgents: ['niagaresearch', 'niagamarketing', 'niagacomputer', 'niagaops', 'niagahubbot'],
        _source: 'openclaw-gateway',
      })
    }

    if (path === '/models') {
      const { getOpenClawModels } = await getOpenClawLib()

      const models = await Promise.race([
        getOpenClawModels(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5_000)),
      ]).catch(() => ([
        { id: 'openclaw/main', name: 'NiagaBot', provider: 'openclaw', category: 'general' },
        { id: 'openclaw/niagaresearch', name: 'NiagaResearchBot', provider: 'openclaw', category: 'research' },
        { id: 'openclaw/niagamarketing', name: 'NiagaMarketingBot', provider: 'openclaw', category: 'marketing' },
        { id: 'openclaw/niagaops', name: 'NiagaOpsBot', provider: 'openclaw', category: 'operations' },
        { id: 'openclaw/niagahubbot', name: 'NiagaStrategistBot', provider: 'openclaw', category: 'strategy' },
        { id: 'openclaw/niagacomputer', name: 'NiagaComputerBot', provider: 'openclaw', category: 'computation' },
        { id: 'openclaw/niagareporter', name: 'NiagaReporterBot', provider: 'openclaw', category: 'reporting' },
        { id: 'openclaw/niagaaggregator', name: 'NiagaAggregatorBot', provider: 'openclaw', category: 'aggregation' },
      ]))

      return NextResponse.json({
        models,
        total: models.length,
        _source: 'openclaw-gateway',
      })
    }

    if (path.startsWith('/conversations')) {
      return NextResponse.json({ conversations: [], _source: 'openclaw-gateway' })
    }

    return NextResponse.json({
      message: 'A2A Proxy ready',
      gateway: getGatewayUrl(),
      endpoints: ['/agents', '/status', '/models', '/execute'],
    })
  } catch (error) {
    console.error('A2A proxy GET error:', error)
    return NextResponse.json({ error: 'A2A proxy request failed' }, { status: 500 })
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
    const {
      discoverAgents,
      runChainedPipeline,
      runParallelPipeline,
      openClawCompletion,
    } = await getOpenClawLib()

    if (path === '/execute' || path === '/orchestrate') {
      const userQuery = body.task || body.query || body.message || body.prompt || ''
      if (!userQuery) {
        return NextResponse.json({ error: 'Query/task is required. Send {task: "..."} in body.' }, { status: 400 })
      }

      const mode = body.mode || 'sequential'

      console.error(`[A2A] Starting ${mode} pipeline for: "${userQuery.substring(0, 80)}..."`)
      console.error(`[A2A] Gateway: ${getGatewayUrl()}`)

      const result = mode === 'parallel'
        ? await runParallelPipeline(userQuery)
        : await runChainedPipeline(userQuery)

      console.error(`[A2A] Pipeline ${result.status}. Duration: ${result.totalDurationMs}ms. Source: ${result._source}`)
      for (const step of result.pipeline) {
        console.error(`[A2A]   ${step.agent}: ${step.status} (${step.durationMs}ms)`)
      }

      return NextResponse.json({ ...result, mode })
    }

    const agentMatch = path.match(/\/agents\/(.+)\/message/)
    if (agentMatch) {
      const agentId = agentMatch[1]
      const agents = await discoverAgents()
      const agent = agents.find((item) => item.id === agentId)

      if (!agent) {
        return NextResponse.json({ error: `Agent "${agentId}" not found`, availableAgents: agents.map((item) => item.id) }, { status: 404 })
      }

      const message = body.message || body.content || body.task || ''
      if (!message) {
        return NextResponse.json({ error: 'Message content required' }, { status: 400 })
      }

      const agentSystemPrompts: Record<string, string> = {
        niagaresearch: 'Anda adalah NiagaResearch, ejen penyelidikan pakar dari NiagaBot. Tugas anda: analisis pasaran Shopee Malaysia, kenal pasti trend produk, kaji pesaing, dan berikan data yang tepat. Jawab dalam Bahasa Melayu campur Bahasa Inggeris (Manglish style). Berikan fakta dan nombor yang spesifik.',
        niagamarketing: 'Anda adalah NiagaMarketing, ejen pemasaran dari NiagaBot. Tugas anda: tulis ayat pemasaran yang viral, buat strategi content untuk TikTok/Instagram/Facebook, dan sasarkan audiens Malaysia. Gunakan bahasa santai dan menarik. Sertakan emoji dan hashtag.',
        niagacomputer: 'Anda adalah NiagaComputer, ejen pengiraan dari NiagaBot. Tugas anda: kira ROI, optimumkan bajet, buat unjuran prestasi, dan format output sebagai JSON yang kemas. Berikan nombor yang tepat dan cadangan berdasarkan data.',
        niagaops: 'Anda adalah NiagaOps, ejen operasi dari NiagaBot. Tugas anda: pantau kesihatan sistem, urus deployment, tangani insiden teknikal, dan optimumkan infrastruktur. Berikan status reports yang jelas.',
        niagahubbot: 'Anda adalah NiagaStrategist, ejen strategi dari NiagaBot. Tugas anda: bangunkan strategi perniagaan, positioning pasaran, perancangan pertumbuhan, dan analisis kompetitif untuk affiliate Shopee Malaysia.',
        niagaaggregator: 'Anda adalah NiagaAggregator dari NiagaBot. Tugas anda: gabungkan output dari semua ejen lain, selesaikan konflik, dan cipta laporan bersepadu yang jelas dan boleh diambil tindakan.',
        niagareporter: 'Anda adalah NiagaReporter dari NiagaBot. Tugas anda: cipta laporan akhir yang profesional dengan ringkasan eksekutif, visualisasi data (dalam bentuk markdown), dan senarai tindakan seterusnya.',
      }

      const result = await openClawCompletion({
        model: `openclaw/${agentId}`,
        messages: [
          { role: 'system', content: agentSystemPrompts[agentId] || `You are ${agent.name}. ${agent.description}` },
          { role: 'user', content: message },
        ],
        thinking: { type: 'disabled' },
      })

      const responseText = extractResponseText(result)
      const source = extractResultSource(result)

      console.log(`[A2A] NiagaBot "${agentId}" responded. Source: ${source}`)

      return NextResponse.json({
        agentId,
        agentName: agent.name,
        response: responseText,
        _source: source,
      })
    }

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
    }, { status: 500 })
  }
}
