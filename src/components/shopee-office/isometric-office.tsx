'use client'

import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Language } from './language-toggle'

// ===== Types =====
interface IsometricOfficeProps {
  agents: Array<{
    agentId: string
    name: string
    emoji: string
    status: string
    detail: string
    tasksCompleted: number
  }>
  language: Language
  onSelectAgent?: (agentId: string) => void
}

// ===== Zone Definitions =====
const ZONES = [
  { id: 'research', label: { en: 'Research', cn: '研究', jp: '調査' }, color: '#a855f7', bg: 'rgba(168,85,247,0.08)', agentIds: ['product-scout', 'analytics-agent'] },
  { id: 'create', label: { en: 'Create', cn: '创建', jp: '作成' }, color: '#f97316', bg: 'rgba(249,115,22,0.08)', agentIds: ['content-writer', 'link-builder'] },
  { id: 'optimize', label: { en: 'Optimize', cn: '优化', jp: '最適化' }, color: '#eab308', bg: 'rgba(234,179,8,0.08)', agentIds: ['seo-optimizer', 'campaign-master'] },
  { id: 'execute', label: { en: 'Execute', cn: '执行', jp: '実行' }, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', agentIds: ['review-monitor', 'payout-checker'] },
]

// ===== Furniture Definitions (isometric positions) =====
const FURNITURE = [
  // Research zone desks
  { type: 'desk', zone: 'research', row: 0, col: 0, label: { en: 'Scout Desk', cn: '侦察桌', jp: 'スカウト机' } },
  { type: 'desk', zone: 'research', row: 0, col: 1, label: { en: 'Analytics Desk', cn: '分析桌', jp: '分析机' } },
  { type: 'plant', zone: 'research', row: 0, col: 2 },
  // Create zone desks
  { type: 'desk', zone: 'create', row: 1, col: 0, label: { en: 'Writer Desk', cn: '写作桌', jp: 'ライター机' } },
  { type: 'desk', zone: 'create', row: 1, col: 1, label: { en: 'Builder Desk', cn: '构建桌', jp: 'ビルダー机' } },
  { type: 'coffee', zone: 'create', row: 1, col: 2 },
  // Optimize zone desks
  { type: 'desk', zone: 'optimize', row: 2, col: 0, label: { en: 'SEO Desk', cn: 'SEO桌', jp: 'SEO机' } },
  { type: 'desk', zone: 'optimize', row: 2, col: 1, label: { en: 'Campaign Desk', cn: '活动桌', jp: 'キャンペーン机' } },
  { type: 'plant', zone: 'optimize', row: 2, col: 2 },
  // Execute zone desks
  { type: 'desk', zone: 'execute', row: 3, col: 0, label: { en: 'Review Desk', cn: '审核桌', jp: 'レビュー机' } },
  { type: 'desk', zone: 'execute', row: 3, col: 1, label: { en: 'Payout Desk', cn: '支付桌', jp: '支払机' } },
  { type: 'server', zone: 'execute', row: 3, col: 2 },
]

// ===== Status colors =====
const STATUS_COLORS: Record<string, string> = {
  idle: '#22c55e',
  writing: '#f97316',
  researching: '#a855f7',
  executing: '#eab308',
  syncing: '#3b82f6',
  error: '#ef4444',
  thinking: '#06b6d4',
  collaborating: '#ec4899',
  reporting: '#8b5cf6',
  break: '#6b7280',
}

// ===== Isometric Cell Component =====
function IsoCell({
  type,
  agent,
  zone,
  onClick,
}: {
  type: string
  agent?: IsometricOfficeProps['agents'][0]
  zone: typeof ZONES[0]
  onClick?: () => void
}) {
  const statusColor = agent ? (STATUS_COLORS[agent.status] || '#888') : undefined

  return (
    <motion.div
      className="iso-cell"
      style={{
        background: type === 'desk' ? zone.bg : 'transparent',
        borderColor: type === 'desk' ? `${zone.color}33` : 'transparent',
      }}
      onClick={onClick}
      whileHover={agent ? { scale: 1.08, y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {agent ? (
        <div className="iso-agent-wrapper">
          <div
            className="iso-agent-avatar"
            style={{
              borderColor: statusColor,
              boxShadow: `0 0 12px ${statusColor}44, 0 4px 8px rgba(0,0,0,0.3)`,
            }}
          >
            <span className="iso-agent-emoji">{agent.emoji}</span>
            {/* Status indicator */}
            <div
              className="iso-status-dot"
              style={{
                background: statusColor,
                animation: agent.status === 'error' ? 'dotPulse 1s ease-in-out infinite' : 'none',
              }}
            />
          </div>
          <div className="iso-agent-name" style={{ color: statusColor }}>
            {agent.name}
          </div>
          <div className="iso-agent-status">{agent.status}</div>
        </div>
      ) : type === 'desk' ? (
        <div className="iso-desk-icon">🖥️</div>
      ) : type === 'plant' ? (
        <div className="iso-plant-icon">🪴</div>
      ) : type === 'coffee' ? (
        <div className="iso-coffee-icon">☕</div>
      ) : type === 'server' ? (
        <div className="iso-server-icon">🗄️</div>
      ) : null}
    </motion.div>
  )
}

// ===== Zone Header =====
function ZoneHeader({ zone, language }: { zone: typeof ZONES[0]; language: Language }) {
  return (
    <div className="iso-zone-header" style={{ borderColor: zone.color }}>
      <div className="iso-zone-dot" style={{ background: zone.color, boxShadow: `0 0 8px ${zone.color}66` }} />
      <span style={{ color: zone.color, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>
        {zone.label[language as 'en' | 'cn' | 'jp']}
      </span>
    </div>
  )
}

// ===== Main Component =====
export function IsometricOffice({ agents, language, onSelectAgent }: IsometricOfficeProps) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale((prev) => Math.max(0.5, Math.min(2, prev - e.deltaY * 0.001)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Reset view
  const resetView = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  // Map agents to zones
  const getAgentForDesk = useCallback((zoneId: string, col: number) => {
    const zone = ZONES.find((z) => z.id === zoneId)
    if (!zone) return undefined
    const agentId = zone.agentIds[col]
    return agents.find((a) => a.agentId === agentId)
  }, [agents])

  return (
    <motion.div
      className="shopee-office-panel"
      style={{ flex: '1 1 100%', minWidth: 0 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="shopee-panel-title flex items-center justify-between">
        <span className="flex items-center gap-2">
          🏗️ Isometric Office
          <span style={{ fontSize: 8, color: '#555', letterSpacing: 0.5, fontWeight: 'normal' }}>
            CSS-Based View
          </span>
        </span>
        <div className="flex items-center gap-2">
          <button className="shopee-btn" onClick={resetView} style={{ fontSize: 9, padding: '2px 8px' }}>
            Reset
          </button>
          <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace' }}>
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      {/* Isometric Container */}
      <div
        className="iso-viewport"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="iso-world"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Isometric grid with zones */}
          <div className="iso-floor">
            {ZONES.map((zone) => (
              <div key={zone.id} className="iso-zone">
                <ZoneHeader zone={zone} language={language} />
                <div className="iso-zone-grid">
                  {[0, 1, 2].map((col) => {
                    const furniture = FURNITURE.find((f) => f.zone === zone.id && f.col === col)
                    const agent = furniture?.type === 'desk' ? getAgentForDesk(zone.id, col) : undefined
                    return (
                      <IsoCell
                        key={`${zone.id}-${col}`}
                        type={furniture?.type || 'empty'}
                        agent={agent}
                        zone={zone}
                        onClick={agent ? () => onSelectAgent?.(agent.agentId) : undefined}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="iso-legend">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="iso-legend-item">
            <div className="iso-legend-dot" style={{ background: color }} />
            <span>{status}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
