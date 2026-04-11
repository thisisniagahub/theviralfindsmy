'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Award, AlertTriangle, Clock } from 'lucide-react'
import type { Language } from './language-toggle'

// ===== Types =====
interface AgentPerformanceProps {
  agents: Array<{
    agentId: string
    name: string
    emoji: string
    status: string
    detail: string
    tasksCompleted: number
  }>
  language: Language
}

// ===== Performance calculation =====
interface AgentMetrics {
  agentId: string
  name: string
  emoji: string
  tasksCompleted: number
  productivityScore: number
  avgResponseTime: number
  uptimePercent: number
  status: string
  trend: 'up' | 'down' | 'stable'
  team: string
}

const TEAM_MAP: Record<string, string> = {
  'product-scout': 'Research',
  'analytics-agent': 'Research',
  'content-writer': 'Create',
  'link-builder': 'Create',
  'seo-optimizer': 'Optimize',
  'campaign-master': 'Optimize',
  'review-monitor': 'Execute',
  'payout-checker': 'Execute',
}

const TEAM_COLORS: Record<string, string> = {
  Research: '#a855f7',
  Create: '#f97316',
  Optimize: '#eab308',
  Execute: '#22c55e',
}

function calculateMetrics(agents: AgentPerformanceProps['agents']): AgentMetrics[] {
  return agents.map((agent) => {
    // Simulated metrics based on task completion
    const baseScore = Math.min(100, 30 + agent.tasksCompleted * 5)
    const productivityScore = Math.round(baseScore + Math.random() * 15)
    const avgResponseTime = Math.round(800 + Math.random() * 2200) // ms
    const uptimePercent = Math.round(90 + Math.random() * 10)
    const trend: 'up' | 'down' | 'stable' = productivityScore > 70 ? 'up' : productivityScore > 40 ? 'stable' : 'down'

    return {
      agentId: agent.agentId,
      name: agent.name,
      emoji: agent.emoji,
      tasksCompleted: agent.tasksCompleted,
      productivityScore: Math.min(100, productivityScore),
      avgResponseTime,
      uptimePercent,
      status: agent.status,
      trend,
      team: TEAM_MAP[agent.agentId] || 'Unknown',
    }
  })
}

// ===== Score Ring =====
function ScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444'

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2a2d3e" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size > 40 ? 14 : 10, fontFamily: 'monospace', fontWeight: 'bold', color,
      }}>
        {score}
      </div>
    </div>
  )
}

// ===== Component =====
export function AgentPerformance({ agents, language }: AgentPerformanceProps) {
  const metrics = useMemo(() => calculateMetrics(agents), [agents])
  const [selectedTeam, setSelectedTeam] = useState<string>('all')

  const filteredMetrics = selectedTeam === 'all' ? metrics : metrics.filter((m) => m.team === selectedTeam)

  // Team aggregate metrics
  const teamMetrics = useMemo(() => {
    const teams: Record<string, { count: number; totalScore: number; totalTasks: number; totalResponse: number }> = {}
    metrics.forEach((m) => {
      if (!teams[m.team]) teams[m.team] = { count: 0, totalScore: 0, totalTasks: 0, totalResponse: 0 }
      teams[m.team].count++
      teams[m.team].totalScore += m.productivityScore
      teams[m.team].totalTasks += m.tasksCompleted
      teams[m.team].totalResponse += m.avgResponseTime
    })
    return Object.entries(teams).map(([team, data]) => ({
      team,
      avgScore: Math.round(data.totalScore / data.count),
      totalTasks: data.totalTasks,
      avgResponse: Math.round(data.totalResponse / data.count),
      color: TEAM_COLORS[team] || '#888',
    }))
  }, [metrics])

  // Top performer
  const topPerformer = metrics.length > 0 ? [...metrics].sort((a, b) => b.productivityScore - a.productivityScore)[0] : null

  // Bottleneck (slowest agent)
  const bottleneck = metrics.length > 0 ? [...metrics].sort((a, b) => b.avgResponseTime - a.avgResponseTime)[0] : null

  const translations = {
    en: { title: 'Performance', team: 'Team', score: 'Score', response: 'Avg Response', tasks: 'Tasks', uptime: 'Uptime', topPerformer: 'Top Performer', bottleneck: 'Bottleneck', all: 'All' },
    cn: { title: '表现', team: '团队', score: '分数', response: '平均响应', tasks: '任务', uptime: '在线率', topPerformer: '最佳表现', bottleneck: '瓶颈', all: '全部' },
    jp: { title: 'パフォーマンス', team: 'チーム', score: 'スコア', response: '平均応答', tasks: 'タスク', uptime: '稼働率', topPerformer: 'トップ', bottleneck: 'ボトルネック', all: 'すべて' },
  }
  const t = translations[language]

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
          📊 {t.title}
          <TrendingUp size={12} style={{ color: '#22c55e' }} />
        </span>
      </div>

      {/* Team filter */}
      <div className="flex items-center gap-1 mb-3">
        <button
          className={`shopee-btn ${selectedTeam === 'all' ? 'shopee-btn-active' : ''}`}
          onClick={() => setSelectedTeam('all')}
          style={{ fontSize: 9, padding: '2px 8px' }}
        >
          {t.all}
        </button>
        {Object.entries(TEAM_COLORS).map(([team, color]) => (
          <button
            key={team}
            className={`shopee-btn ${selectedTeam === team ? 'shopee-btn-active' : ''}`}
            onClick={() => setSelectedTeam(team)}
            style={{ fontSize: 9, padding: '2px 8px', borderColor: selectedTeam === team ? color : undefined }}
          >
            <span style={{ color, fontSize: 8 }}>●</span> {team}
          </button>
        ))}
      </div>

      {/* Highlight cards */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {topPerformer && (
          <div className="shopee-productivity-card" style={{ flex: '1 1 140px', maxWidth: 180, borderColor: '#FFD70033' }}>
            <div className="flex items-center gap-1 mb-1">
              <Award size={10} style={{ color: '#FFD700' }} />
              <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#FFD700', fontWeight: 'bold' }}>{t.topPerformer}</span>
            </div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#e0e0e0' }}>
              {topPerformer.emoji} {topPerformer.name}
            </div>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#22c55e', fontWeight: 'bold' }}>
              {topPerformer.productivityScore}/100
            </div>
          </div>
        )}

        {bottleneck && (
          <div className="shopee-productivity-card" style={{ flex: '1 1 140px', maxWidth: 180, borderColor: '#ef444433' }}>
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle size={10} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#ef4444', fontWeight: 'bold' }}>{t.bottleneck}</span>
            </div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#e0e0e0' }}>
              {bottleneck.emoji} {bottleneck.name}
            </div>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#f97316', fontWeight: 'bold' }}>
              {(bottleneck.avgResponseTime / 1000).toFixed(1)}s
            </div>
          </div>
        )}
      </div>

      {/* Team aggregate bars */}
      <div className="space-y-2 mb-3">
        {teamMetrics.map((team) => (
          <div key={team.team} className="flex items-center gap-2">
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: team.color, width: 60, textAlign: 'right', fontWeight: 'bold' }}>
              {team.team}
            </span>
            <div style={{ flex: 1, height: 6, background: '#1e2130', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 3, background: team.color }}
                initial={{ width: 0 }}
                animate={{ width: `${team.avgScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#888', width: 30 }}>
              {team.avgScore}%
            </span>
          </div>
        ))}
      </div>

      {/* Agent cards */}
      <div className="space-y-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#EE4D2D33 transparent' }}>
        {filteredMetrics.map((m) => (
          <div
            key={m.agentId}
            className="shopee-agent-item"
            style={{ padding: '6px 10px' }}
          >
            <ScoreRing score={m.productivityScore} size={32} />
            <div className="flex-1 min-w-0 ml-2">
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 13 }}>{m.emoji}</span>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#e0e0e0', fontWeight: 'bold' }}>{m.name}</span>
                {m.trend === 'up' && <TrendingUp size={10} style={{ color: '#22c55e' }} />}
                {m.trend === 'down' && <TrendingUp size={10} style={{ color: '#ef4444', transform: 'scaleY(-1)' }} />}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#888' }}>
                  <Clock size={8} style={{ display: 'inline' }} /> {(m.avgResponseTime / 1000).toFixed(1)}s
                </span>
                <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#888' }}>
                  ✅ {m.tasksCompleted}
                </span>
                <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#888' }}>
                  ⬆ {m.uptimePercent}%
                </span>
              </div>
            </div>
            <div style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, background: `${TEAM_COLORS[m.team]}15`, color: TEAM_COLORS[m.team], fontFamily: 'monospace' }}>
              {m.team}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
