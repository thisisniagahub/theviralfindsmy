'use client'

import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import type { Language } from './language-toggle'

type AgentStatus = 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error'

export interface BasicInfoAgent {
  agentId: string
  name: string
  emoji: string
  status: AgentStatus
  tasksCompleted: number
  authStatus: 'approved' | 'pending' | 'offline'
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: '#888', writing: '#3b82f6', researching: '#22c55e',
  executing: '#f97316', syncing: '#06b6d4', error: '#ef4444',
}

const translations = {
  en: { back: 'BACK', tasksCompleted: 'TASKS', authStatus: 'AUTH' },
  ms: { back: 'KEMBALI', tasksCompleted: 'TUGAS', authStatus: 'AUTENTIKASI' },
}

function StatusRing({ status, size = 100 }: { status: AgentStatus; size?: number }) {
  const color = STATUS_COLORS[status]
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const isActive = status !== 'idle'

  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      {isActive && (
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius + 2}
          fill="none" stroke={color} strokeWidth="1" strokeOpacity={0.3}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.2, 0.5, 0.2], rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: 'center' }}
        />
      )}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth="2"
        strokeDasharray={isActive ? `${circumference * 0.25} ${circumference * 0.75}` : `${circumference} 0`}
        strokeLinecap="butt" opacity={isActive ? 0.8 : 0.4}
      />
      {isActive && (
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
          strokeLinecap="butt" opacity={0.5}
          initial={{ rotate: 0 }} animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: 'center' }}
        />
      )}
    </svg>
  )
}

function PixelCorner({ position, color }: { position: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const rotations: Record<string, string> = { tl: '', tr: 'rotate(90)', bl: 'rotate(-90)', br: 'rotate(180)' }
  return (
    <svg width="12" height="12" viewBox="0 0 12 12"
      style={{ position: 'absolute', [position === 'tl' ? 'top' : position === 'tr' ? 'top' : 'bottom']: '2px', [position === 'tl' || position === 'bl' ? 'left' : 'right']: '2px', transform: rotations[position], pointerEvents: 'none', zIndex: 2 }}>
      <path d="M0 0 L0 12 L2 12 L2 2 L12 2 L12 0 Z" fill={color} />
    </svg>
  )
}

interface AgentBasicInfoProps {
  agent: BasicInfoAgent
  onBack: () => void
  role: string
  description: string
  language: Language
}

export function AgentBasicInfo({ agent, onBack, role, description, language }: AgentBasicInfoProps) {
  const t = translations[language]
  const statusColor = STATUS_COLORS[agent.status]

  const authDisplay: Record<string, { label: string; color: string }> = {
    approved: { label: 'OK', color: '#22c55e' },
    pending: { label: 'WAIT', color: '#eab308' },
    offline: { label: 'OFF', color: '#666' },
  }
  const auth = authDisplay[agent.authStatus] || authDisplay.offline

  return (
    <>
      <PixelCorner position="tl" color="#3B82F6" />
      <PixelCorner position="tr" color="#3B82F6" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid #1a2040' }}
      >
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1a1e2e', border: '1px solid #2a3050', borderRadius: '4px', padding: '4px 10px', color: '#888', cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1px' }}
        >
          <ChevronLeft size={12} /> {t.back}
        </motion.button>
        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e0e0e0', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          {agent.name}
        </span>
        <div style={{
          fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px',
          padding: '3px 10px', borderRadius: '3px',
          background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}66`,
        }}>
          {agent.status.toUpperCase()}
        </div>
      </motion.div>

      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #1a2040' }}
      >
        <div style={{
          width: '120px', height: '120px', borderRadius: '50%',
          border: `2px solid ${statusColor}55`, background: '#0d1125',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          boxShadow: `0 0 15px ${statusColor}22, inset 0 0 15px ${statusColor}08`,
        }}>
          <StatusRing status={agent.status} size={110} />
          <motion.span
            key={agent.emoji} initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
            style={{ fontSize: '72px', lineHeight: 1 }}
          >
            {agent.emoji}
          </motion.span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          style={{ marginTop: '10px', fontFamily: 'monospace', fontSize: '14px', color: '#3B82F6', fontWeight: 'bold', letterSpacing: '1px' }}
        >
          {role}
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#555', letterSpacing: '1px', marginBottom: '2px' }}>{t.tasksCompleted}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', color: statusColor }}>{agent.tasksCompleted}</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#1a2040' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#555', letterSpacing: '1px', marginBottom: '2px' }}>{t.authStatus}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', color: auth.color }}>{auth.label}</div>
          </div>
        </div>
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        style={{ fontFamily: 'monospace', fontSize: '10px', color: '#666', textAlign: 'center', lineHeight: '1.5', marginBottom: '16px', padding: '0 16px' }}
      >
        {description}
      </motion.p>
    </>
  )
}
