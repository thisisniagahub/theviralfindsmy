/**
 * Typed event bus bridging Phaser game ↔ React UI.
 * Inspired by agent-town's GameEventBus pattern.
 */

import type { AgentStatus } from '../types'

export interface GameEventMap {
  // Agent lifecycle
  'agent-selected': [agentId: string]
  'agent-deselected': []
  'agent-status-changed': [agentId: string, status: AgentStatus]

  // Interaction
  'open-terminal': [agentId?: string]
  'open-terminal-queue': [agentId: string]
  'stop-task': [runId: string, agentId: string]
  'terminal-closed': []

  // Session / Config
  'new-session-for-agent': [agentId: string]
  'open-session-history': [agentId: string]
  'seat-configs-updated': [seats: unknown[]]

  // Task
  'task-assigned': [taskId: string, message: string, agentId?: string]
  'task-completed': [runId: string]
  'task-failed': [runId: string]

  // Boss / Player
  'boss-moved': [x: number, y: number]
  'boss-interact': [agentId: string]

  // Earnings / Commissions
  'commission-earned': [amount: number, source: string]
}

type Listener<T extends unknown[]> = (...args: T) => void

class GameEventBus {
  private listeners = new Map<string, Set<Listener<unknown[]>>>()

  on<K extends keyof GameEventMap>(event: K, fn: Listener<GameEventMap[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)?.add(fn as Listener<unknown[]>)
    return () => this.off(event, fn)
  }

  off<K extends keyof GameEventMap>(event: K, fn: Listener<GameEventMap[K]>) {
    this.listeners.get(event)?.delete(fn as Listener<unknown[]>)
  }

  emit<K extends keyof GameEventMap>(event: K, ...args: GameEventMap[K]) {
    this.listeners.get(event)?.forEach((fn) => {
      try {
        fn(...args)
      } catch (err) {
        console.error(`[GameEventBus] listener error on "${event}":`, err)
      }
    })
  }
}

export const gameEvents = new GameEventBus()
