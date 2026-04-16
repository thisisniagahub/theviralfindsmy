import {
  extractMessageContent,
  getOpenClawModels,
  openClawCompletion,
} from './gateway-client'
import { invokeGatewayTool } from './tools'

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

interface AgentCache {
  agents: A2AAgentDefinition[]
  updatedAt: number
}

const AGENT_CACHE_TTL_MS = 5 * 60 * 1_000

const FALLBACK_AGENTS: A2AAgentDefinition[] = [
  {
    id: 'main',
    name: 'NiagaBot',
    description: 'Primary AI assistant that coordinates Shopee affiliate workflows across research, planning, and execution.',
    capabilities: ['general-assistance', 'orchestration', 'planning', 'tool-routing'],
    status: 'online',
    category: 'general',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagamarketing',
    name: 'NiagaMarketingBot',
    description: 'Marketing agent that writes campaigns, hooks, audience strategies, and social plans for Malaysian affiliate growth.',
    capabilities: ['copywriting', 'campaign-planning', 'social-media-strategy', 'audience-targeting'],
    status: 'online',
    category: 'marketing',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagaresearch',
    name: 'NiagaResearchBot',
    description: 'Research agent that studies Shopee demand, market trends, products, and competitor movements.',
    capabilities: ['trend-analysis', 'market-research', 'competitor-scanning', 'demand-forecasting'],
    status: 'online',
    category: 'research',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagaops',
    name: 'NiagaOpsBot',
    description: 'Operations agent that monitors system health, manages deployments, and handles DevOps workflows.',
    capabilities: ['system-monitoring', 'deployment', 'devops', 'incident-response'],
    status: 'online',
    category: 'operations',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagahubbot',
    name: 'NiagaStrategistBot',
    description: 'Strategy agent that develops business plans, positioning, market expansion ideas, and growth priorities.',
    capabilities: ['business-strategy', 'market-positioning', 'growth-planning', 'competitive-intel'],
    status: 'online',
    category: 'strategy',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagacomputer',
    name: 'NiagaComputerBot',
    description: 'Computational agent that runs ROI analysis, budget modeling, and performance projections.',
    capabilities: ['roi-calculation', 'budget-optimization', 'forecasting', 'performance-reporting'],
    status: 'online',
    category: 'computation',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagareporter',
    name: 'NiagaReporterBot',
    description: 'Reporting agent that turns results into polished summaries, reports, and next-step briefs.',
    capabilities: ['report-writing', 'executive-summary', 'recommendation-prioritization', 'report-formatting'],
    status: 'online',
    category: 'reporting',
    tasksCompleted: 0,
    version: '1.0.0',
  },
  {
    id: 'niagaaggregator',
    name: 'NiagaAggregatorBot',
    description: 'Aggregation agent that merges outputs from multiple agents into one coherent answer.',
    capabilities: ['output-merging', 'synthesis', 'conflict-resolution', 'summary-generation'],
    status: 'online',
    category: 'aggregation',
    tasksCompleted: 0,
    version: '1.0.0',
  },
]

const agentCache: AgentCache = {
  agents: FALLBACK_AGENTS,
  updatedAt: 0,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getAgentFallback(agentId: string): A2AAgentDefinition | undefined {
  return FALLBACK_AGENTS.find((agent) => agent.id === agentId)
}

function slugFromModelId(modelId: string): string {
  return modelId.includes('/') ? modelId.split('/').pop() || modelId : modelId
}

function mapModelToAgent(model: { id: string; name: string; category: string }): A2AAgentDefinition | null {
  const agentId = slugFromModelId(model.id)
  const fallback = getAgentFallback(agentId)

  if (!fallback) {
    return null
  }

  return {
    ...fallback,
    id: agentId,
    name: model.name || fallback.name,
    category: model.category || fallback.category,
  }
}

function createPipelineStep(agent: string, status: 'success' | 'error', output: string, durationMs: number) {
  return { agent, status, output, durationMs }
}

function toOutputText(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (isRecord(value)) {
    if (typeof value.output === 'string') {
      return value.output
    }

    if (typeof value.response === 'string') {
      return value.response
    }

    if (typeof value.text === 'string') {
      return value.text
    }
  }

  return extractMessageContent(value)
}

async function runLegacyChainedPipeline(userQuery: string): Promise<ChainedPipelineResult> {
  const pipelineStart = Date.now()
  const pipeline: ChainedPipelineResult['pipeline'] = []

  const researchStart = Date.now()
  let researchOutput = ''
  try {
    const researchResult = await openClawCompletion({
      model: 'openclaw/niagaresearch',
      messages: [
        {
          role: 'system',
          content: 'You are NiagaResearch, a deep research agent specializing in Shopee Malaysia affiliate marketing. Analyze the query, gather key data points, identify trends and opportunities. Be thorough and data-driven.',
        },
        { role: 'user', content: userQuery },
      ],
      thinking: { type: 'disabled' },
    })
    researchOutput = toOutputText(researchResult)
  } catch (error) {
    researchOutput = `Research phase encountered an error: ${error instanceof Error ? error.message : String(error)}`
  }
  pipeline.push(createPipelineStep('niagaresearch', 'success', researchOutput, Date.now() - researchStart))

  const marketingStart = Date.now()
  let marketingOutput = ''
  try {
    const marketingResult = await openClawCompletion({
      model: 'openclaw/niagamarketing',
      messages: [
        {
          role: 'system',
          content: 'You are NiagaMarketing, a marketing strategy agent for Shopee Malaysia affiliates. Based on the research findings, develop actionable marketing strategies, content plans, and audience targeting recommendations.',
        },
        {
          role: 'user',
          content: `Based on this research:\n${researchOutput}\n\nDevelop a marketing strategy for: ${userQuery}`,
        },
      ],
      thinking: { type: 'disabled' },
    })
    marketingOutput = toOutputText(marketingResult)
  } catch (error) {
    marketingOutput = `Marketing phase encountered an error: ${error instanceof Error ? error.message : String(error)}`
  }
  pipeline.push(createPipelineStep('niagamarketing', 'success', marketingOutput, Date.now() - marketingStart))

  const computerStart = Date.now()
  let computerOutput = ''
  try {
    const computerResult = await openClawCompletion({
      model: 'openclaw/niagacomputer',
      messages: [
        {
          role: 'system',
          content: 'You are NiagaComputer, a computational agent for Shopee Malaysia affiliates. Based on the research and marketing strategy, calculate projected ROI, budget allocations, expected performance metrics, and provide optimization recommendations.',
        },
        {
          role: 'user',
          content: `Research:\n${researchOutput}\n\nMarketing Strategy:\n${marketingOutput}\n\nCompute ROI and projections for: ${userQuery}`,
        },
      ],
      thinking: { type: 'disabled' },
    })
    computerOutput = toOutputText(computerResult)
  } catch (error) {
    computerOutput = `Computation phase encountered an error: ${error instanceof Error ? error.message : String(error)}`
  }
  pipeline.push(createPipelineStep('niagacomputer', 'success', computerOutput, Date.now() - computerStart))

  const finalOutput = [
    `## Research Findings\n${researchOutput}`,
    `## Marketing Strategy\n${marketingOutput}`,
    `## ROI and Projections\n${computerOutput}`,
  ].join('\n\n---\n\n')

  return {
    status: 'completed',
    query: userQuery,
    pipeline,
    finalOutput,
    totalDurationMs: Date.now() - pipelineStart,
    _source: 'sdk-fallback',
  }
}

async function runLegacyParallelPipeline(userQuery: string): Promise<ChainedPipelineResult> {
  const pipelineStart = Date.now()
  const stepStarts = {
    niagaresearch: Date.now(),
    niagamarketing: Date.now(),
    niagacomputer: Date.now(),
  }

  const [research, marketing, computer] = await Promise.allSettled([
    openClawCompletion({
      model: 'openclaw/niagaresearch',
      messages: [
        { role: 'system', content: 'You are NiagaResearch. Analyze trends, gather data, and identify Shopee opportunities.' },
        { role: 'user', content: userQuery },
      ],
      thinking: { type: 'disabled' },
    }),
    openClawCompletion({
      model: 'openclaw/niagamarketing',
      messages: [
        { role: 'system', content: 'You are NiagaMarketing. Develop marketing strategies, hooks, and distribution ideas.' },
        { role: 'user', content: userQuery },
      ],
      thinking: { type: 'disabled' },
    }),
    openClawCompletion({
      model: 'openclaw/niagacomputer',
      messages: [
        { role: 'system', content: 'You are NiagaComputer. Calculate ROI projections and budget splits.' },
        { role: 'user', content: userQuery },
      ],
      thinking: { type: 'disabled' },
    }),
  ])

  const pipeline: ChainedPipelineResult['pipeline'] = [
    research.status === 'fulfilled'
      ? createPipelineStep('niagaresearch', 'success', toOutputText(research.value), Date.now() - stepStarts.niagaresearch)
      : createPipelineStep('niagaresearch', 'error', String(research.reason), Date.now() - stepStarts.niagaresearch),
    marketing.status === 'fulfilled'
      ? createPipelineStep('niagamarketing', 'success', toOutputText(marketing.value), Date.now() - stepStarts.niagamarketing)
      : createPipelineStep('niagamarketing', 'error', String(marketing.reason), Date.now() - stepStarts.niagamarketing),
    computer.status === 'fulfilled'
      ? createPipelineStep('niagacomputer', 'success', toOutputText(computer.value), Date.now() - stepStarts.niagacomputer)
      : createPipelineStep('niagacomputer', 'error', String(computer.reason), Date.now() - stepStarts.niagacomputer),
  ]

  const aggregatorInput = pipeline
    .map((step) => `${step.agent}:\n${step.output}`)
    .join('\n\n')

  let finalOutput = pipeline.map((step) => step.output).join('\n\n---\n\n')
  try {
    const aggregatorResult = await openClawCompletion({
      model: 'openclaw/niagaaggregator',
      messages: [
        {
          role: 'system',
          content: 'You are NiagaAggregator. Consolidate outputs from multiple agents into one clear answer with prioritized recommendations.',
        },
        {
          role: 'user',
          content: `Consolidate these agent outputs for query "${userQuery}":\n\n${aggregatorInput}`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    finalOutput = toOutputText(aggregatorResult)
    pipeline.push(createPipelineStep('niagaaggregator', 'success', finalOutput, 0))
  } catch (error) {
    pipeline.push(createPipelineStep('niagaaggregator', 'error', String(error), 0))
  }

  return {
    status: pipeline.some((step) => step.status === 'error') ? 'partial' : 'completed',
    query: userQuery,
    pipeline,
    finalOutput,
    totalDurationMs: Date.now() - pipelineStart,
    _source: 'sdk-fallback',
  }
}

export function getA2AAgents(): A2AAgentDefinition[] {
  return agentCache.agents
}

export async function discoverAgents(forceRefresh = false): Promise<A2AAgentDefinition[]> {
  if (!forceRefresh && agentCache.updatedAt > 0 && Date.now() - agentCache.updatedAt < AGENT_CACHE_TTL_MS) {
    return agentCache.agents
  }

  try {
    const models = await getOpenClawModels()
    const agents = models
      .filter((model) => model.id.startsWith('openclaw/'))
      .map((model) => mapModelToAgent(model))
      .filter((agent): agent is A2AAgentDefinition => Boolean(agent))

    if (agents.length > 0) {
      agentCache.agents = agents
      agentCache.updatedAt = Date.now()
      return agents
    }
  } catch {
    // Fall back to the static catalog below.
  }

  agentCache.agents = FALLBACK_AGENTS
  agentCache.updatedAt = Date.now()
  return agentCache.agents
}

export async function spawnSubAgent(agentId: string, message: string, sessionKey?: string): Promise<unknown> {
  const derivedSessionKey = sessionKey || `pipeline-${agentId}-${Date.now()}`

  return invokeGatewayTool('sessions_spawn', {
    agentId,
    task: message,
    message,
    sessionKey: derivedSessionKey,
    timeoutSeconds: 60,
    wait: true,
  }, 'main')
}

export async function runChainedPipeline(userQuery: string): Promise<ChainedPipelineResult> {
  const pipelineStart = Date.now()
  const pipeline: ChainedPipelineResult['pipeline'] = []

  try {
    const researchStart = Date.now()
    const researchResult = await spawnSubAgent('niagaresearch', userQuery, `pipeline-niagaresearch-${Date.now()}`)
    const researchOutput = toOutputText(researchResult)
    pipeline.push(createPipelineStep('niagaresearch', 'success', researchOutput, Date.now() - researchStart))

    const marketingStart = Date.now()
    const marketingResult = await spawnSubAgent(
      'niagamarketing',
      `Based on this research:\n${researchOutput}\n\nDevelop a marketing strategy for: ${userQuery}`,
      `pipeline-niagamarketing-${Date.now()}`
    )
    const marketingOutput = toOutputText(marketingResult)
    pipeline.push(createPipelineStep('niagamarketing', 'success', marketingOutput, Date.now() - marketingStart))

    const computerStart = Date.now()
    const computerResult = await spawnSubAgent(
      'niagacomputer',
      `Research:\n${researchOutput}\n\nMarketing Strategy:\n${marketingOutput}\n\nCompute ROI and projections for: ${userQuery}`,
      `pipeline-niagacomputer-${Date.now()}`
    )
    const computerOutput = toOutputText(computerResult)
    pipeline.push(createPipelineStep('niagacomputer', 'success', computerOutput, Date.now() - computerStart))

    const finalOutput = [
      `## Research Findings\n${researchOutput}`,
      `## Marketing Strategy\n${marketingOutput}`,
      `## ROI and Projections\n${computerOutput}`,
    ].join('\n\n---\n\n')

    if (pipeline.some((step) => step.output.trim().length < 12)) {
      return runLegacyChainedPipeline(userQuery)
    }

    return {
      status: 'completed',
      query: userQuery,
      pipeline,
      finalOutput,
      totalDurationMs: Date.now() - pipelineStart,
      _source: 'gateway',
    }
  } catch {
    return runLegacyChainedPipeline(userQuery)
  }
}

export async function runParallelPipeline(userQuery: string): Promise<ChainedPipelineResult> {
  const pipelineStart = Date.now()

  try {
    const starts = {
      niagaresearch: Date.now(),
      niagamarketing: Date.now(),
      niagacomputer: Date.now(),
    }

    const [research, marketing, computer] = await Promise.allSettled([
      spawnSubAgent('niagaresearch', userQuery, `parallel-niagaresearch-${Date.now()}`),
      spawnSubAgent('niagamarketing', userQuery, `parallel-niagamarketing-${Date.now()}`),
      spawnSubAgent('niagacomputer', userQuery, `parallel-niagacomputer-${Date.now()}`),
    ])

    const pipeline: ChainedPipelineResult['pipeline'] = [
      research.status === 'fulfilled'
        ? createPipelineStep('niagaresearch', 'success', toOutputText(research.value), Date.now() - starts.niagaresearch)
        : createPipelineStep('niagaresearch', 'error', String(research.reason), Date.now() - starts.niagaresearch),
      marketing.status === 'fulfilled'
        ? createPipelineStep('niagamarketing', 'success', toOutputText(marketing.value), Date.now() - starts.niagamarketing)
        : createPipelineStep('niagamarketing', 'error', String(marketing.reason), Date.now() - starts.niagamarketing),
      computer.status === 'fulfilled'
        ? createPipelineStep('niagacomputer', 'success', toOutputText(computer.value), Date.now() - starts.niagacomputer)
        : createPipelineStep('niagacomputer', 'error', String(computer.reason), Date.now() - starts.niagacomputer),
    ]

    const shouldFallback = pipeline.some((step) => step.status === 'error' || step.output.trim().length < 12)
    if (shouldFallback) {
      return runLegacyParallelPipeline(userQuery)
    }

    const aggregationPrompt = pipeline
      .map((step) => `${step.agent}:\n${step.output}`)
      .join('\n\n')

    const aggregatorResult = await openClawCompletion({
      model: 'openclaw/niagaaggregator',
      messages: [
        {
          role: 'system',
          content: 'You are NiagaAggregator. Consolidate outputs from multiple agents into a unified, actionable report.',
        },
        {
          role: 'user',
          content: `Consolidate these outputs for "${userQuery}":\n\n${aggregationPrompt}`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const finalOutput = toOutputText(aggregatorResult)
    pipeline.push(createPipelineStep('niagaaggregator', 'success', finalOutput, 0))

    return {
      status: pipeline.some((step) => step.status === 'error') ? 'partial' : 'completed',
      query: userQuery,
      pipeline,
      finalOutput,
      totalDurationMs: Date.now() - pipelineStart,
      _source: 'gateway',
    }
  } catch {
    return runLegacyParallelPipeline(userQuery)
  }
}
