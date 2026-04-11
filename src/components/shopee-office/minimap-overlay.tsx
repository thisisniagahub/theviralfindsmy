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

import { 
  AGENT_SEAT_DEFS, 
  OFFICE_COLLISIONS, 
  OFFICE_POIS,
  GAME_WIDTH as OFFICE_W,
  GAME_HEIGHT as OFFICE_H
} from './game/config'

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

// Find agent pos helper
const getAgentHomePos = (agentId: string) => {
  const seat = AGENT_SEAT_DEFS.find(s => s.seatId === agentId)
  return seat ? { x: seat.x, y: seat.y } : { x: 0, y: 0 }
}

// ===== Component =====
export function MinimapOverlay({ agents, visible = true, onToggle }: MinimapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)

  const MINIMAP_W = 180
  const MINIMAP_H = 100

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

    // Draw collisions (furniture/walls)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    OFFICE_COLLISIONS.forEach(col => {
      ctx.fillRect(col.x * scaleX, col.y * scaleY, col.width * scaleX, col.height * scaleY)
    })

    // Draw POIs
    ctx.fillStyle = 'rgba(238, 77, 45, 0.2)'
    OFFICE_POIS.forEach(poi => {
      ctx.beginPath()
      ctx.arc(poi.x * scaleX, poi.y * scaleY, 2, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw walls (border)
    ctx.strokeStyle = '#2a2d3e'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, MINIMAP_W, MINIMAP_H)

    // Draw agent dots
    agents.forEach((agent) => {
      const pos = getAgentHomePos(agent.agentId)
      if (pos.x === 0 && pos.y === 0) return

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
  }, [agents, hoveredAgent, OFFICE_W, OFFICE_H])

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
