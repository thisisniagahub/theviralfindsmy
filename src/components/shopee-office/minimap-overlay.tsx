'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map } from 'lucide-react'

// ===== Types =====
interface MinimapOverlayProps {
  agents: Array<{
    agentId: string
    name: string
    emoji: string
    status: string
  }>
  visible?: boolean
  onToggle?: () => void
}

// ===== Constants =====
const MINIMAP_W = 180
const MINIMAP_H = 100
const OFFICE_W = 1280
const OFFICE_H = 720

// Status colors
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

// Agent positions (scaled from game config)
const AGENT_POSITIONS: Record<string, { x: number; y: number; zone: string }> = {
  'product-scout': { x: 540, y: 180, zone: 'Research' },
  'link-builder': { x: 640, y: 180, zone: 'Research' },
  'campaign-master': { x: 740, y: 180, zone: 'Create' },
  'analytics-agent': { x: 200, y: 350, zone: 'Create' },
  'content-writer': { x: 300, y: 350, zone: 'Optimize' },
  'payout-checker': { x: 750, y: 480, zone: 'Optimize' },
  'seo-optimizer': { x: 850, y: 480, zone: 'Execute' },
  'review-monitor': { x: 950, y: 350, zone: 'Execute' },
}

// Zone colors
const ZONE_COLORS: Record<string, string> = {
  Research: '#a855f7',
  Create: '#f97316',
  Optimize: '#eab308',
  Execute: '#22c55e',
}

// ===== Component =====
export function MinimapOverlay({ agents, visible = true, onToggle }: MinimapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)

  const drawMinimap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaleX = MINIMAP_W / OFFICE_W
    const scaleY = MINIMAP_H / OFFICE_H

    // Clear
    ctx.fillStyle = '#0a0e1a'
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)

    // Draw zone regions
    const zones = [
      { name: 'Research', x: 100, y: 60, w: 700, h: 200, color: 'Research' },
      { name: 'Create', x: 100, y: 260, w: 400, h: 200, color: 'Create' },
      { name: 'Optimize', x: 600, y: 300, w: 400, h: 200, color: 'Optimize' },
      { name: 'Execute', x: 800, y: 260, w: 400, h: 300, color: 'Execute' },
    ]

    zones.forEach((zone) => {
      const zx = zone.x * scaleX
      const zy = zone.y * scaleY
      const zw = zone.w * scaleX
      const zh = zone.h * scaleY
      ctx.fillStyle = `${ZONE_COLORS[zone.color] || '#333'}11`
      ctx.strokeStyle = `${ZONE_COLORS[zone.color] || '#333'}33`
      ctx.lineWidth = 0.5
      ctx.fillRect(zx, zy, zw, zh)
      ctx.strokeRect(zx, zy, zw, zh)
    })

    // Draw walls (border)
    ctx.strokeStyle = '#2a2d3e'
    ctx.lineWidth = 1
    ctx.strokeRect(2, 2, MINIMAP_W - 4, MINIMAP_H - 4)

    // Draw agent dots
    agents.forEach((agent) => {
      const pos = AGENT_POSITIONS[agent.agentId]
      if (!pos) return

      const x = pos.x * scaleX
      const y = pos.y * scaleY
      const color = STATUS_COLORS[agent.status] || '#888'
      const isHovered = hoveredAgent === agent.agentId
      const radius = isHovered ? 5 : 3

      // Glow
      ctx.beginPath()
      ctx.arc(x, y, radius + 3, 0, Math.PI * 2)
      ctx.fillStyle = `${color}22`
      ctx.fill()

      // Dot
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // Border
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.strokeStyle = '#ffffff44'
      ctx.lineWidth = 0.5
      ctx.stroke()
    })

    // Boss marker (center bottom)
    const bossX = 640 * scaleX
    const bossY = 650 * scaleY
    ctx.beginPath()
    ctx.arc(bossX, bossY, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#EE4D2D'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(bossX, bossY, 4, 0, Math.PI * 2)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()

    // "You" label
    ctx.font = '7px monospace'
    ctx.fillStyle = '#EE4D2D'
    ctx.textAlign = 'center'
    ctx.fillText('YOU', bossX, bossY + 10)
  }, [agents, hoveredAgent])

  useEffect(() => {
    if (visible) drawMinimap()
  }, [visible, drawMinimap, agents])

  // Handle click on minimap
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const scaleX = MINIMAP_W / OFFICE_W
    const scaleY = MINIMAP_H / OFFICE_H

    // Check if clicked on an agent
    for (const agent of agents) {
      const pos = AGENT_POSITIONS[agent.agentId]
      if (!pos) continue
      const ax = pos.x * scaleX
      const ay = pos.y * scaleY
      const dist = Math.sqrt((x - ax) ** 2 + (y - ay) ** 2)
      if (dist < 8) {
        setHoveredAgent(agent.agentId)
        return
      }
    }
    setHoveredAgent(null)
  }, [agents])

  if (!visible) return null

  return (
    <motion.div
      className="minimap-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        zIndex: 10,
        background: 'rgba(10, 14, 26, 0.9)',
        border: '2px solid #2a2d3e',
        borderRadius: 6,
        padding: 4,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#888', padding: '0 4px' }}>
          <Map size={8} style={{ display: 'inline', marginRight: 2 }} />
          MAP
        </span>
        <button
          onClick={onToggle}
          style={{
            fontSize: 8,
            fontFamily: 'monospace',
            color: '#666',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 4px',
          }}
        >
          ✕
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        onClick={handleClick}
        style={{ borderRadius: 4, cursor: 'pointer', display: 'block' }}
      />

      {/* Hovered agent tooltip */}
      <AnimatePresence>
        {hoveredAgent && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              background: '#141722',
              border: '1px solid #2a2d3e',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 9,
              fontFamily: 'monospace',
              color: '#e0e0e0',
              whiteSpace: 'nowrap',
              marginBottom: 4,
            }}
          >
            {agents.find((a) => a.agentId === hoveredAgent)?.emoji}{' '}
            {agents.find((a) => a.agentId === hoveredAgent)?.name} —{' '}
            <span style={{ color: STATUS_COLORS[agents.find((a) => a.agentId === hoveredAgent)?.status || 'idle'] }}>
              {agents.find((a) => a.agentId === hoveredAgent)?.status}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
