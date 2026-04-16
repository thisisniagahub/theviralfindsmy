/**
 * Shopee Office State Store
 *
 * In-memory store for the Shopee Office pixel visualization system.
 * Manages office status, main agents (Shopee affiliate), and guest agents.
 * Includes auto-idle mechanism: if no update for 300 seconds, state resets to idle.
 */

import { randomUUID } from 'crypto'

// ─── Types ───────────────────────────────────────────────────────────────────

export type OfficeState =
  | 'idle'
  | 'writing'
  | 'researching'
  | 'executing'
  | 'syncing'
  | 'error'

export type AgentArea = 'breakroom' | 'writing' | 'error'
export type AuthStatus = 'approved' | 'pending' | 'rejected' | 'offline'
export type AgentSource = 'local' | 'remote'

export interface OfficeStatus {
  state: OfficeState
  detail: string
  progress: number
  updated_at: string
}

export interface OfficeAgent {
  agentId: string
  name: string
  emoji: string
  isMain: boolean
  state: string
  detail: string
  area: AgentArea
  authStatus: AuthStatus
  updated_at: string
  source: AgentSource
  // Guest-specific fields
  joinedAt?: string
  lastPushAt?: string
}

export interface GuestAgent extends OfficeAgent {
  joinedAt: string
  lastPushAt: string
}

export interface SetStatusRequest {
  state: OfficeState
  detail: string
  progress?: number
}

export interface UpdateAgentRequest {
  state: string
  detail?: string
}

export interface JoinRequest {
  name: string
  joinKey: string
  state?: string
  detail?: string
}

export interface ApproveRequest {
  action: 'approve' | 'reject'
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AUTO_IDLE_MS = 300_000 // 300 seconds

function getJoinKey(): string {
  const key = process.env.OFFICE_JOIN_KEY
  if (!key) {
    // During build time, return a placeholder to avoid blocking compilation
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return 'build-placeholder'
    }
    if (process.env.NODE_ENV !== 'production') {
      return 'dev-join-key'
    }
    throw new Error('OFFICE_JOIN_KEY environment variable is required in production')
  }
  return key
}

const MAX_CONCURRENT_GUESTS = 3

// ─── Initial Data ────────────────────────────────────────────────────────────

const initialMainAgents: OfficeAgent[] = [
  {
    agentId: 'product-scout',
    name: 'Product Hunter',
    emoji: '🔍',
    isMain: true,
    state: 'researching',
    detail: 'Scanning Shopee trending products & flash sales',
    area: 'writing',
    authStatus: 'approved',
    updated_at: new Date().toISOString(),
    source: 'local',
  },
  {
    agentId: 'link-builder',
    name: 'Link Generator',
    emoji: '🔗',
    isMain: true,
    state: 'executing',
    detail: 'Generating affiliate links for 12 new products',
    area: 'writing',
    authStatus: 'approved',
    updated_at: new Date().toISOString(),
    source: 'local',
  },
  {
    agentId: 'campaign-master',
    name: 'Campaign Boss',
    emoji: '🎯',
    isMain: true,
    state: 'writing',
    detail: 'Creating Shopee campaign: 9.9 Mega Sale',
    area: 'writing',
    authStatus: 'approved',
    updated_at: new Date().toISOString(),
    source: 'local',
  },
  {
    agentId: 'analytics-agent',
    name: 'Analytics Pro',
    emoji: '📈',
    isMain: true,
    state: 'researching',
    detail: 'Analyzing CTR & conversion rate data',
    area: 'writing',
    authStatus: 'approved',
    updated_at: new Date().toISOString(),
    source: 'local',
  },
  {
    agentId: 'content-writer',
    name: 'Content Creator',
    emoji: '✍️',
    isMain: true,
    state: 'syncing',
    detail: 'Syncing TikTok & IG content with Shopee listings',
    area: 'writing',
    authStatus: 'approved',
    updated_at: new Date().toISOString(),
    source: 'local',
  },
  {
    agentId: 'payout-checker',
    name: 'Commission Tracker',
    emoji: '💰',
    isMain: true,
    state: 'idle',
    detail: 'Verifying RM 2,450 pending commission payout',
    area: 'breakroom',
    authStatus: 'approved',
    updated_at: new Date().toISOString(),
    source: 'local',
  },
  {
    agentId: 'seo-optimizer',
    name: 'SEO Specialist',
    emoji: '⚙️',
    isMain: true,
    state: 'executing',
    detail: 'Optimizing product titles for Shopee search ranking',
    area: 'writing',
    authStatus: 'approved',
    updated_at: new Date().toISOString(),
    source: 'local',
  },
  {
    agentId: 'review-monitor',
    name: 'Review Watcher',
    emoji: '⭐',
    isMain: true,
    state: 'writing',
    detail: 'Monitoring product reviews & seller ratings',
    area: 'writing',
    authStatus: 'approved',
    updated_at: new Date().toISOString(),
    source: 'local',
  },
]

// ─── Store ───────────────────────────────────────────────────────────────────

let officeStatus: OfficeStatus = {
  state: 'idle',
  detail: 'Shopee Office - Ready',
  progress: 0,
  updated_at: new Date().toISOString(),
}

const officeAgents: OfficeAgent[] = [...initialMainAgents]

// ─── Auto-Idle Check ────────────────────────────────────────────────────────

function checkAutoIdle() {
  const elapsed = Date.now() - new Date(officeStatus.updated_at).getTime()
  if (elapsed > AUTO_IDLE_MS && officeStatus.state !== 'idle') {
    officeStatus.state = 'idle'
    officeStatus.detail = 'Shopee Office - Ready'
    officeStatus.progress = 0
    officeStatus.updated_at = new Date().toISOString()
  }
}

// ─── Helper: Derive area from state ──────────────────────────────────────────

function deriveArea(state: string): AgentArea {
  if (state === 'idle') return 'breakroom'
  if (state === 'error') return 'error'
  return 'writing'
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getOfficeStatus(): OfficeStatus {
  checkAutoIdle()
  return { ...officeStatus }
}

export function setOfficeStatus(req: SetStatusRequest): OfficeStatus {
  checkAutoIdle()
  officeStatus = {
    state: req.state,
    detail: req.detail,
    progress: req.progress ?? officeStatus.progress,
    updated_at: new Date().toISOString(),
  }
  return { ...officeStatus }
}

export function getAllAgents(): OfficeAgent[] {
  checkAutoIdle()
  return officeAgents.map((a) => ({ ...a }))
}

export function getMainAgents(): OfficeAgent[] {
  checkAutoIdle()
  return officeAgents.filter((a) => a.isMain).map((a) => ({ ...a }))
}

export function getGuestAgents(): GuestAgent[] {
  checkAutoIdle()
  return officeAgents
    .filter((a) => !a.isMain)
    .map((a) => ({
      ...a,
      joinedAt: a.joinedAt ?? '',
      lastPushAt: a.lastPushAt ?? '',
    }))
}

export function updateAgent(
  agentId: string,
  req: UpdateAgentRequest
): OfficeAgent | null {
  checkAutoIdle()
  const agent = officeAgents.find((a) => a.agentId === agentId)
  if (!agent) return null

  agent.state = req.state
  if (req.detail !== undefined) agent.detail = req.detail
  agent.area = deriveArea(req.state)
  agent.updated_at = new Date().toISOString()
  if (!agent.isMain) {
    agent.lastPushAt = new Date().toISOString()
  }
  return { ...agent }
}

export function joinOffice(req: JoinRequest): {
  ok: boolean
  agentId?: string
  authStatus?: AuthStatus
  error?: string
} {
  checkAutoIdle()

  // Validate join key
  if (req.joinKey !== getJoinKey()) {
    return { ok: false, error: 'Invalid join key' }
  }

  // Check max concurrent guests
  const currentOnline = officeAgents.filter(
    (a) => !a.isMain && a.authStatus === 'approved'
  ).length
  if (currentOnline >= MAX_CONCURRENT_GUESTS) {
    return { ok: false, error: 'Office is at maximum capacity' }
  }

  // Check duplicate name
  const nameExists = officeAgents.some(
    (a) => a.name.toLowerCase() === req.name.toLowerCase()
  )
  if (nameExists) {
    return { ok: false, error: 'An agent with this name already exists' }
  }

  const agentId = `guest-${Date.now()}-${randomUUID().slice(0, 6)}`
  const now = new Date().toISOString()

  const newAgent: OfficeAgent = {
    agentId,
    name: req.name,
    emoji: '🤖',
    isMain: false,
    state: req.state ?? 'idle',
    detail: req.detail ?? 'Just joined the Shopee Office',
    area: deriveArea(req.state ?? 'idle'),
    authStatus: 'approved',
    updated_at: now,
    source: 'remote',
    joinedAt: now,
    lastPushAt: now,
  }

  officeAgents.push(newAgent)
  return { ok: true, agentId, authStatus: 'approved' }
}

export function approveAgent(
  agentId: string,
  action: 'approve' | 'reject'
): boolean {
  const agent = officeAgents.find((a) => a.agentId === agentId)
  if (!agent) return false
  if (agent.isMain) return false // Can't approve main agents

  agent.authStatus = action === 'approve' ? 'approved' : 'rejected'
  agent.updated_at = new Date().toISOString()
  return true
}

export function leaveOffice(agentId: string): boolean {
  const index = officeAgents.findIndex((a) => a.agentId === agentId)
  if (index === -1) return false
  officeAgents.splice(index, 1)
  return true
}

export function getJoinInfo(): {
  maxConcurrent: number
  currentOnline: number
} {
  const currentOnline = officeAgents.filter(
    (a) => !a.isMain && a.authStatus === 'approved'
  ).length
  return {
    maxConcurrent: MAX_CONCURRENT_GUESTS,
    currentOnline,
  }
}
