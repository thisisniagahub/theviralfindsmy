/**
 * Unified type definitions for Shopee Office.
 * Single source of truth for agent statuses, colors, and shared interfaces.
 */

// ===== Agent Status (shared across game engine + React UI) =====
export type AgentStatus =
  | 'idle'
  | 'writing'
  | 'researching'
  | 'executing'
  | 'syncing'
  | 'error'
  | 'thinking'
  | 'collaborating'
  | 'reporting'
  | 'break'

export type AgentZone = 'rest' | 'work' | 'sync' | 'error'

// ===== Status Colors (dual format for Phaser hex + CSS string) =====
export interface StatusColor {
  hex: number
  css: string
}

export const STATUS_COLORS: Record<AgentStatus, StatusColor> = {
  idle:          { hex: 0x22c55e, css: '#22c55e' },
  writing:       { hex: 0xf97316, css: '#f97316' },
  researching:   { hex: 0xa855f7, css: '#a855f7' },
  executing:     { hex: 0xeab308, css: '#eab308' },
  syncing:       { hex: 0x3b82f6, css: '#3b82f6' },
  error:         { hex: 0xef4444, css: '#ef4444' },
  thinking:      { hex: 0x06b6d4, css: '#06b6d4' },
  collaborating: { hex: 0xec4899, css: '#ec4899' },
  reporting:     { hex: 0x8b5cf6, css: '#8b5cf6' },
  break:         { hex: 0x6b7280, css: '#6b7280' },
}

// ===== Agent Colors (per-agent brand colors) =====
export const AGENT_COLORS: Record<string, StatusColor> = {
  'product-scout':    { hex: 0xFF6B35, css: '#FF6B35' },
  'link-builder':     { hex: 0x4ECDC4, css: '#4ECDC4' },
  'campaign-master':  { hex: 0xEE4D2D, css: '#EE4D2D' },
  'analytics-agent':  { hex: 0x7C4DFF, css: '#7C4DFF' },
  'content-writer':   { hex: 0xFF4081, css: '#FF4081' },
  'payout-checker':   { hex: 0xFFB300, css: '#FFB300' },
  'seo-optimizer':    { hex: 0x00E676, css: '#00E676' },
  'review-monitor':   { hex: 0xFFD700, css: '#FFD700' },
}

// ===== Agent Data (unified interface for React ↔ Phaser) =====
export interface AgentData {
  id: string
  name: string
  emoji: string
  status: AgentStatus
  detail: string
  zone: AgentZone
  updatedAt: string
  tasksCompleted: number
}

export function isAgentStatus(value: string): value is AgentStatus {
  return value in STATUS_COLORS
}
