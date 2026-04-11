'use client'

import { motion } from 'framer-motion'
import { Activity, Cpu, Wifi, Zap, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { Language } from './language-toggle'

// ===== Types =====
interface OfficeHealthCardProps {
  agents: Array<{
    agentId: string
    name: string
    emoji: string
    status: string
    tasksCompleted: number
    authStatus: string
  }>
  isPaused: boolean
  language: Language
}

// ===== Translations =====
const translations = {
  en: {
    title: 'Office Health',
    systemStatus: 'System',
    networkStatus: 'Network',
    cpuUsage: 'CPU',
    uptime: 'Uptime',
    healthy: 'Healthy',
    degraded: 'Degraded',
    critical: 'Critical',
    paused: 'Paused',
  },
  cn: {
    title: '办公室健康',
    systemStatus: '系统',
    networkStatus: '网络',
    cpuUsage: 'CPU',
    uptime: '运行时间',
    healthy: '健康',
    degraded: '降级',
    critical: '严重',
    paused: '暂停',
  },
  jp: {
    title: 'オフィス健康状態',
    systemStatus: 'システム',
    networkStatus: 'ネットワーク',
    cpuUsage: 'CPU',
    uptime: '稼働時間',
    healthy: '正常',
    degraded: '低下',
    critical: '重大',
    paused: '一時停止',
  },
}

// ===== Status Indicator =====
function StatusIndicator({ status }: { status: 'healthy' | 'degraded' | 'critical' | 'paused' }) {
  const config = {
    healthy: { color: '#22c55e', icon: CheckCircle2, label: '●' },
    degraded: { color: '#eab308', icon: AlertTriangle, label: '●' },
    critical: { color: '#ef4444', icon: XCircle, label: '●' },
    paused: { color: '#888', icon: Activity, label: '●' },
  }

  const c = config[status]

  return (
    <motion.span
      style={{ color: c.color, fontSize: 10 }}
      animate={status !== 'paused' ? { opacity: [1, 0.5, 1] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {c.label}
    </motion.span>
  )
}

// ===== Progress Ring =====
function MiniProgressRing({ value, max, color, size = 36 }: { value: number; max: number; color: string; size?: number }) {
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(100, (value / max) * 100)
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1a1e2e" strokeWidth="3" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  )
}

// ===== Component =====
export function OfficeHealthCard({ agents, isPaused, language }: OfficeHealthCardProps) {
  const t = translations[language]

  const onlineAgents = agents.filter((a) => a.authStatus !== 'offline')
  const activeAgents = agents.filter((a) => a.status !== 'idle' && a.status !== 'error')
  const errorAgents = agents.filter((a) => a.status === 'error')
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0)

  const healthScore = Math.max(0, Math.min(100,
    100 - (errorAgents.length * 20) - (isPaused ? 30 : 0) + (activeAgents.length * 5)
  ))

  const systemStatus = isPaused ? 'paused' as const
    : healthScore >= 80 ? 'healthy' as const
    : healthScore >= 50 ? 'degraded' as const
    : 'critical' as const

  const cpuUsage = Math.min(95, 20 + activeAgents.length * 12 + Math.random() * 10)
  const uptimeHours = Math.floor((Date.now() - new Date().setHours(0, 0, 0, 0)) / 3600000)

  return (
    <motion.div
      className="shopee-office-panel"
      style={{ flex: '0 0 220px', minWidth: 200 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <div className="shopee-panel-title flex items-center gap-2">
        <Activity size={14} style={{ color: '#22c55e' }} />
        {t.title}
      </div>

      {/* Health Score */}
      <div className="flex items-center justify-center mb-3">
        <div className="relative">
          <MiniProgressRing
            value={healthScore}
            max={100}
            color={systemStatus === 'healthy' ? '#22c55e' : systemStatus === 'degraded' ? '#eab308' : '#ef4444'}
            size={64}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{
              fontFamily: 'monospace',
              fontSize: 16,
              fontWeight: 'bold',
              color: systemStatus === 'healthy' ? '#22c55e' : systemStatus === 'degraded' ? '#eab308' : '#ef4444',
            }}>
              {healthScore}
            </span>
          </div>
        </div>
      </div>

      {/* Status Labels */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <StatusIndicator status={systemStatus} />
        <span style={{
          fontSize: 11,
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: systemStatus === 'healthy' ? '#22c55e' : systemStatus === 'degraded' ? '#eab308' : '#ef4444',
        }}>
          {systemStatus === 'paused' ? t.paused : systemStatus === 'healthy' ? t.healthy : systemStatus === 'degraded' ? t.degraded : t.critical}
        </span>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5 rounded" style={{ background: '#1a1e2e' }}>
          <div className="flex items-center gap-2">
            <Cpu size={11} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace' }}>{t.cpuUsage}</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 50, height: 4, background: '#0d1020', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 2, background: cpuUsage > 80 ? '#ef4444' : cpuUsage > 60 ? '#eab308' : '#22c55e' }}
                initial={{ width: 0 }}
                animate={{ width: `${cpuUsage}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <span style={{ fontSize: 9, color: '#aaa', fontFamily: 'monospace', minWidth: 28, textAlign: 'right' }}>
              {Math.round(cpuUsage)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 py-1.5 rounded" style={{ background: '#1a1e2e' }}>
          <div className="flex items-center gap-2">
            <Wifi size={11} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace' }}>{t.networkStatus}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ animation: 'dotPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 9, color: '#22c55e', fontFamily: 'monospace' }}>Online</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 py-1.5 rounded" style={{ background: '#1a1e2e' }}>
          <div className="flex items-center gap-2">
            <Zap size={11} style={{ color: '#f97316' }} />
            <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace' }}>{t.uptime}</span>
          </div>
          <span style={{ fontSize: 9, color: '#aaa', fontFamily: 'monospace' }}>{uptimeHours}h</span>
        </div>
      </div>

      {/* Agent Summary */}
      <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-3 gap-1 text-center">
        <div>
          <div style={{ fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace', color: '#22c55e' }}>{activeAgents.length}</div>
          <div style={{ fontSize: 8, color: '#666', fontFamily: 'monospace' }}>ACTIVE</div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace', color: '#3b82f6' }}>{onlineAgents.length}</div>
          <div style={{ fontSize: 8, color: '#666', fontFamily: 'monospace' }}>ONLINE</div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace', color: '#ef4444' }}>{errorAgents.length}</div>
          <div style={{ fontSize: 8, color: '#666', fontFamily: 'monospace' }}>ERRORS</div>
        </div>
      </div>
    </motion.div>
  )
}
