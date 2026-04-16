/**
 * Agent State Machine for Shopee Office
 * Inspired by pixel-agents' agent state management pattern.
 * Defines valid state transitions, duration tracking, and OpenClaw activity mapping.
 */

import { STATUS_COLORS, type AgentStatus } from './types'

// ===== Extended Agent States =====
export type ExtendedAgentStatus = AgentStatus

// ===== State Metadata =====
export interface StateMeta {
  color: string
  emoji: string
  label: { en: string; cn: string; jp: string }
  animation: string
  isWorking: boolean
}

export const STATE_META: Record<ExtendedAgentStatus, StateMeta> = {
  idle: { color: STATUS_COLORS.idle.css, emoji: '💤', label: { en: 'Idle', cn: '空闲', jp: 'アイドル' }, animation: 'none', isWorking: false },
  writing: { color: STATUS_COLORS.writing.css, emoji: '✍️', label: { en: 'Writing', cn: '编写', jp: '執筆' }, animation: 'typing', isWorking: true },
  researching: { color: STATUS_COLORS.researching.css, emoji: '🔬', label: { en: 'Researching', cn: '研究', jp: '調査' }, animation: 'pulse', isWorking: true },
  executing: { color: STATUS_COLORS.executing.css, emoji: '⚡', label: { en: 'Executing', cn: '执行', jp: '実行' }, animation: 'spin', isWorking: true },
  syncing: { color: STATUS_COLORS.syncing.css, emoji: '🔄', label: { en: 'Syncing', cn: '同步', jp: '同期' }, animation: 'spin', isWorking: true },
  error: { color: STATUS_COLORS.error.css, emoji: '🐛', label: { en: 'Error', cn: '错误', jp: 'エラー' }, animation: 'shake', isWorking: false },
  thinking: { color: STATUS_COLORS.thinking.css, emoji: '🧠', label: { en: 'Thinking', cn: '思考', jp: '思考' }, animation: 'pulse', isWorking: true },
  collaborating: { color: STATUS_COLORS.collaborating.css, emoji: '🤝', label: { en: 'Collaborating', cn: '协作', jp: 'コラボ' }, animation: 'bounce', isWorking: true },
  reporting: { color: STATUS_COLORS.reporting.css, emoji: '📊', label: { en: 'Reporting', cn: '汇报', jp: 'レポート' }, animation: 'wave', isWorking: true },
  break: { color: STATUS_COLORS.break.css, emoji: '☕', label: { en: 'Break', cn: '休息', jp: '休憩' }, animation: 'none', isWorking: false },
}

// ===== Valid State Transitions =====
const VALID_TRANSITIONS: Record<ExtendedAgentStatus, ExtendedAgentStatus[]> = {
  idle: ['thinking', 'researching', 'writing', 'break', 'error'],
  thinking: ['researching', 'writing', 'collaborating', 'idle', 'error'],
  researching: ['thinking', 'writing', 'collaborating', 'reporting', 'idle', 'error'],
  writing: ['executing', 'syncing', 'thinking', 'idle', 'error'],
  executing: ['syncing', 'reporting', 'idle', 'error'],
  syncing: ['idle', 'reporting', 'error'],
  collaborating: ['writing', 'researching', 'idle', 'error'],
  reporting: ['idle', 'syncing', 'error'],
  break: ['idle', 'thinking', 'error'],
  error: ['idle', 'break'],
}

export function isValidTransition(from: ExtendedAgentStatus, to: ExtendedAgentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getValidNextStates(current: ExtendedAgentStatus): ExtendedAgentStatus[] {
  return VALID_TRANSITIONS[current] || ['idle']
}

// ===== OpenClaw Activity → Agent State Mapping =====
const OPENCLAW_STATE_MAP: Record<string, ExtendedAgentStatus> = {
  // niagaresearch activities
  'scanning trends': 'researching',
  'analyzing market': 'researching',
  'gathering data': 'researching',
  'deep research': 'researching',
  // niagamarketing activities
  'crafting content': 'writing',
  'writing copy': 'writing',
  'creating strategy': 'thinking',
  'marketing plan': 'thinking',
  // niagacomputer activities
  'calculating roi': 'executing',
  'computing budget': 'executing',
  'optimizing': 'executing',
  'formatting data': 'syncing',
  // niagaaggregator activities
  'aggregating': 'syncing',
  'merging outputs': 'collaborating',
  'consolidating': 'syncing',
  // niagareporter activities
  'generating report': 'reporting',
  'creating summary': 'reporting',
  'visualization': 'reporting',
}

export function mapOpenClawActivityToState(activity: string): ExtendedAgentStatus {
  const lower = activity.toLowerCase()
  for (const [keyword, state] of Object.entries(OPENCLAW_STATE_MAP)) {
    if (lower.includes(keyword)) return state
  }
  return 'thinking' // default for unknown activities
}

// ===== Agent ID → Default State Mapping =====
const AGID_DEFAULT_STATE: Record<string, ExtendedAgentStatus> = {
  'product-scout': 'researching',
  'analytics-agent': 'researching',
  'content-writer': 'writing',
  'link-builder': 'writing',
  'seo-optimizer': 'executing',
  'campaign-master': 'executing',
  'review-monitor': 'reporting',
  'payout-checker': 'syncing',
}

export function getDefaultStateForAgent(agentId: string): ExtendedAgentStatus {
  return AGID_DEFAULT_STATE[agentId] || 'idle'
}

// ===== State Duration Tracker =====
export interface StateEntry {
  state: ExtendedAgentStatus
  enteredAt: number
  exitedAt: number | null
  durationMs: number | null
}

export class AgentStateTracker {
  private history: Map<string, StateEntry[]> = new Map()
  private maxEntries = 100

  recordStateChange(agentId: string, newState: ExtendedAgentStatus): void {
    const now = Date.now()
    const entries = this.history.get(agentId) || []

    // Close the previous entry
    if (entries.length > 0) {
      const last = entries[entries.length - 1]
      if (last.exitedAt === null) {
        last.exitedAt = now
        last.durationMs = now - last.enteredAt
      }
    }

    // Add new entry
    entries.push({ state: newState, enteredAt: now, exitedAt: null, durationMs: null })
    if (entries.length > this.maxEntries) entries.shift()
    this.history.set(agentId, entries)
  }

  getHistory(agentId: string): StateEntry[] {
    return this.history.get(agentId) || []
  }

  getCurrentDuration(agentId: string): number {
    const entries = this.history.get(agentId) || []
    if (entries.length === 0) return 0
    const last = entries[entries.length - 1]
    return last.exitedAt ? (last.exitedAt - last.enteredAt) : (Date.now() - last.enteredAt)
  }

  isStuck(agentId: string, thresholdMs = 600000): boolean {
    // 10 minutes default threshold
    return this.getCurrentDuration(agentId) > thresholdMs
  }

  getTotalTimeInState(agentId: string, state: ExtendedAgentStatus): number {
    const entries = this.history.get(agentId) || []
    return entries
      .filter((e) => e.state === state)
      .reduce((sum, e) => sum + (e.durationMs || 0), 0)
  }

  getAllAgents(): string[] {
    return Array.from(this.history.keys())
  }

  removeAgent(agentId: string): void {
    this.history.delete(agentId)
  }
}

// Singleton instance
export const agentStateTracker = new AgentStateTracker()
