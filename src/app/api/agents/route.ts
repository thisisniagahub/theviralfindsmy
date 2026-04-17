import { NextResponse } from 'next/server'
import { withErrorHandling, parseJsonBody, ValidationError } from '@/lib/api-handler'
import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse } from '@/lib/api-response'

interface Agent {
  id: string
  name: string
  emoji: string
  role: string
  status: 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error'
  detail: string
  zone: 'rest' | 'work' | 'sync' | 'error'
  updatedAt: string
  tasksCompleted: number
  uptime: string
}

const initialAgents: Agent[] = [
  {
    id: 'product-scout',
    name: 'Product Scout',
    emoji: '🔍',
    role: 'Searches Shopee for trending products',
    status: 'researching',
    detail: 'Searching for trending electronics...',
    zone: 'work',
    updatedAt: new Date(Date.now() - 120000).toISOString(),
    tasksCompleted: 847,
    uptime: '14h 23m',
  },
  {
    id: 'link-builder',
    name: 'Link Builder',
    emoji: '🔗',
    role: 'Creates affiliate links',
    status: 'executing',
    detail: 'Generating affiliate link for "Wireless Earbuds"',
    zone: 'work',
    updatedAt: new Date(Date.now() - 45000).toISOString(),
    tasksCompleted: 1234,
    uptime: '14h 23m',
  },
  {
    id: 'campaign-master',
    name: 'Campaign Master',
    emoji: '📊',
    role: 'Manages campaigns',
    status: 'writing',
    detail: 'Drafting Ramadan Sale campaign copy...',
    zone: 'work',
    updatedAt: new Date(Date.now() - 300000).toISOString(),
    tasksCompleted: 156,
    uptime: '14h 23m',
  },
  {
    id: 'analytics-agent',
    name: 'Analytics Agent',
    emoji: '📈',
    role: 'Processes analytics data',
    status: 'syncing',
    detail: 'Syncing click data from last 24 hours...',
    zone: 'sync',
    updatedAt: new Date(Date.now() - 60000).toISOString(),
    tasksCompleted: 2931,
    uptime: '14h 23m',
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    emoji: '✍️',
    role: 'Writes promotional content',
    status: 'idle',
    detail: 'Waiting for new product assignment...',
    zone: 'rest',
    updatedAt: new Date(Date.now() - 600000).toISOString(),
    tasksCompleted: 523,
    uptime: '14h 23m',
  },
  {
    id: 'payout-checker',
    name: 'Payout Checker',
    emoji: '💰',
    role: 'Monitors earnings',
    status: 'executing',
    detail: 'Verifying RM 284.75 pending payout...',
    zone: 'work',
    updatedAt: new Date(Date.now() - 180000).toISOString(),
    tasksCompleted: 412,
    uptime: '14h 23m',
  },
]

// In-memory store (resets on server restart, which is fine for mock)
const agents = [...initialAgents]

const statusDetails: Record<Agent['status'], string[]> = {
  idle: [
    'Waiting for new product assignment...',
    'On standby, awaiting instructions...',
    'Taking a short break...',
    'Monitoring queue for new tasks...',
  ],
  writing: [
    'Writing product review for "Smart Watch Pro"...',
    'Drafting social media post for flash sale...',
    'Creating email campaign content...',
    'Editing product description for SEO...',
  ],
  researching: [
    'Searching for trending electronics...',
    'Analyzing competitor pricing strategies...',
    'Researching top-selling beauty products...',
    'Scanning Shopee Mall for new arrivals...',
  ],
  executing: [
    'Generating affiliate link for "Wireless Earbuds"',
    'Updating link tracking parameters...',
    'Processing bulk link creation (12 items)...',
    'Verifying RM 284.75 pending payout...',
  ],
  syncing: [
    'Syncing click data from last 24 hours...',
    'Updating conversion tracking records...',
    'Refreshing product inventory data...',
    'Synchronizing campaign performance metrics...',
  ],
  error: [
    'API rate limit exceeded, retrying in 30s...',
    'Failed to fetch product data (timeout)',
    'Shopee API connection timeout',
    'Database sync error — reconnecting...',
  ],
}

export const GET = withErrorHandling(async () => {
  return NextResponse.json(successResponse({ agents }))
})

export const POST = withErrorHandling(async (request) => {
  const { auth, error } = await requireAuth()
  if (error) return error

  const body = await parseJsonBody<{ agentId?: string; status?: Agent['status'] }>(request)

  if (body.agentId && body.status) {
    const agent = agents.find((a) => a.id === body.agentId)
    if (agent) {
      const details = statusDetails[body.status]
      agent.status = body.status
      agent.detail = details[Math.floor(Math.random() * details.length)]
      agent.updatedAt = new Date().toISOString()

      // Update zone based on status
      if (body.status === 'idle') agent.zone = 'rest'
      else if (body.status === 'syncing') agent.zone = 'sync'
      else if (body.status === 'error') agent.zone = 'error'
      else agent.zone = 'work'

      if (body.status !== 'error' && body.status !== 'idle') {
        agent.tasksCompleted += 1
      }
    }
  }

  return NextResponse.json(successResponse({ agents }))
})
