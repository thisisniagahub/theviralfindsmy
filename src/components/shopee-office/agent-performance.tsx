'use client'

import { motion } from 'framer-motion'

type AgentStatus = 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error'

interface PerformanceAgent {
  agentId: string
  status: AgentStatus
  tasksCompleted: number
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: '#888', writing: '#3b82f6', researching: '#22c55e',
  executing: '#f97316', syncing: '#06b6d4', error: '#ef4444',
}

const PERFORMANCE_DATA: Record<string, { uptime: number; avgResponseTime: number; successRate: number; errorCount: number }> = {
  'product-scout': { uptime: 99.7, avgResponseTime: 234, successRate: 98.2, errorCount: 3 },
  'link-builder': { uptime: 99.9, avgResponseTime: 189, successRate: 99.1, errorCount: 1 },
  'campaign-master': { uptime: 98.5, avgResponseTime: 412, successRate: 96.8, errorCount: 5 },
  'analytics-agent': { uptime: 99.8, avgResponseTime: 567, successRate: 97.5, errorCount: 2 },
  'content-writer': { uptime: 99.2, avgResponseTime: 345, successRate: 98.9, errorCount: 2 },
  'payout-checker': { uptime: 99.9, avgResponseTime: 123, successRate: 99.8, errorCount: 0 },
  'seo-optimizer': { uptime: 98.8, avgResponseTime: 298, successRate: 97.1, errorCount: 4 },
  'review-monitor': { uptime: 99.5, avgResponseTime: 156, successRate: 98.5, errorCount: 2 },
}

function MetricCard({ label, value, unit, color, delay }: { label: string; value: number; unit: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{ flex: 1, background: '#0d1125', border: `1px solid ${color}33`, borderRadius: '6px', padding: '10px', textAlign: 'center' }}
    >
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#666', letterSpacing: '1px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold', color, textShadow: `0 0 8px ${color}33` }}>
        {value}{unit}
      </div>
    </motion.div>
  )
}

interface AgentPerformanceProps {
  agent: PerformanceAgent
}

export function AgentPerformance({ agent }: AgentPerformanceProps) {
  const perf = PERFORMANCE_DATA[agent.agentId]
  if (!perf) return null

  const statusColor = STATUS_COLORS[agent.status]

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#f97316', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '8px', height: '1px', background: '#f97316' }} />
        PERFORMANCE METRICS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
        <MetricCard label="UPTIME" value={perf.uptime} unit="%" color="#22c55e" delay={0.1} />
        <MetricCard label="AVG RESP" value={perf.avgResponseTime} unit="ms" color="#3b82f6" delay={0.2} />
        <MetricCard label="SUCCESS" value={perf.successRate} unit="%" color="#06b6d4" delay={0.3} />
        <MetricCard label="ERRORS" value={perf.errorCount} unit="" color={perf.errorCount === 0 ? '#22c55e' : '#f97316'} delay={0.4} />
      </div>

      {/* Current Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#0d1125', borderRadius: '6px', border: `1px solid ${statusColor}33` }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}88` }} />
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#ccc' }}>
          Current: <span style={{ color: statusColor, fontWeight: 'bold' }}>{agent.status.toUpperCase()}</span>
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '10px', color: '#666' }}>
          Tasks: {agent.tasksCompleted}
        </span>
      </div>
    </div>
  )
}
