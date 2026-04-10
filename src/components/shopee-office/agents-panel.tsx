'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import type { Language } from './language-toggle'

type AgentStatus = 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error'

// Unique agent colors
const AGENT_COLORS: Record<string, string> = {
  'product-scout': '#FF6B35',
  'link-builder': '#4ECDC4',
  'campaign-master': '#EE4D2D',
  'analytics-agent': '#7C4DFF',
  'content-writer': '#FF4081',
  'payout-checker': '#FFB300',
  'seo-optimizer': '#00E676',
  'review-monitor': '#FFD700',
}

// Status colors for progress bars
const STATUS_PROGRESS_COLORS: Record<string, string> = {
  idle: '#22c55e',
  writing: '#f97316',
  researching: '#a855f7',
  executing: '#eab308',
  syncing: '#3b82f6',
  error: '#ef4444',
}

export interface AgentInfo {
  agentId: string
  name: string
  emoji: string
  status: AgentStatus
  detail: string
  zone: 'rest' | 'work' | 'sync' | 'error'
  authStatus: 'approved' | 'pending' | 'offline'
  updated_at: string
  tasksCompleted: number
}

interface AgentsPanelProps {
  agents: AgentInfo[]
  onSetAgentStatus: (agentId: string, status: AgentStatus) => void
  onApproveAgent: (agentId: string) => void
  onRejectAgent: (agentId: string) => void
  language: Language
}

const translations = {
  en: {
    title: '👥 Affiliate Agents',
    tasks: 'tasks',
    approve: 'Approve',
    reject: 'Reject',
    pending: 'Pending',
    offline: 'Offline',
  },
  cn: {
    title: '👥 联盟代理',
    tasks: '任务',
    approve: '批准',
    reject: '拒绝',
    pending: '待定',
    offline: '离线',
  },
  jp: {
    title: '👥 アフィリエイトエージェント',
    tasks: 'タスク',
    approve: '承認',
    reject: '拒否',
    pending: '保留中',
    offline: 'オフライン',
  },
}

const statusLabels: Record<string, { en: string; cn: string; jp: string }> = {
  idle: { en: 'Idle', cn: '空闲', jp: '待機' },
  writing: { en: 'Writing', cn: '写作', jp: '執筆' },
  researching: { en: 'Research', cn: '研究', jp: '調査' },
  executing: { en: 'Execute', cn: '执行', jp: '実行' },
  syncing: { en: 'Sync', cn: '同步', jp: '同期' },
  error: { en: 'Error', cn: '错误', jp: 'エラー' },
}

function StatusBadge({ status, lang }: { status: AgentStatus; lang: Language }) {
  const dotClass = `shopee-agent-status-dot shopee-agent-status-dot-${status}`
  const statusEntry = statusLabels[status]
  const label = statusEntry ? statusEntry[lang] : status

  const bgMap: Record<string, string> = {
    idle: 'bg-green-500/10 text-green-400 border-green-500/30',
    writing: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    researching: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    executing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    syncing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    error: 'bg-red-500/10 text-red-400 border-red-500/30',
  }
  const bgClass = bgMap[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] border rounded-sm font-mono ${bgClass}`}>
      <span className={dotClass} style={{ width: 6, height: 6 }} />
      {label}
    </span>
  )
}

export function AgentsPanel({ agents, onSetAgentStatus, onApproveAgent, onRejectAgent, language }: AgentsPanelProps) {
  const t = translations[language]

  return (
    <motion.div
      className="shopee-office-panel shopee-panel-agents"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="shopee-panel-title">{t.title}</div>

      <div className="shopee-agents-list space-y-2">
        {agents.map((agent, idx) => (
          <motion.div
            key={agent.agentId}
            className="shopee-agent-item"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.03 }}
          >
            {/* Avatar with colored ring */}
            <div className="shopee-agent-avatar" style={{ background: `${AGENT_COLORS[agent.agentId] || '#EE4D2D'}22` }}>
              <span className="text-xl">{agent.emoji}</span>
              <div
                className="shopee-agent-avatar-ring"
                style={{ borderColor: STATUS_PROGRESS_COLORS[agent.status] || '#22c55e' }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="shopee-agent-name">{agent.name}</span>
                <StatusBadge status={agent.status} lang={language} />
              </div>
              <p className="shopee-agent-detail mt-0.5">{agent.detail}</p>

              {/* Progress bar */}
              {agent.status !== 'idle' && (
                <div className="shopee-agent-progress">
                  <div
                    className="shopee-agent-progress-bar"
                    style={{
                      width: `${Math.min(100, Math.max(20, agent.tasksCompleted % 100))}%`,
                      background: STATUS_PROGRESS_COLORS[agent.status] || '#EE4D2D',
                    }}
                  />
                </div>
              )}

              {/* Quick status buttons */}
              <div className="flex items-center gap-1 mt-1.5">
                {(['idle', 'writing', 'researching', 'executing'] as AgentStatus[]).map((s) => (
                  <button
                    key={s}
                    className="shopee-agent-action-btn"
                    style={{ width: 'auto', padding: '0 5px', fontSize: 9 }}
                    title={statusLabels[s]?.[language] || s}
                    onClick={() => onSetAgentStatus(agent.agentId, s)}
                  >
                    {s === 'idle' ? '🛋' : s === 'writing' ? '💻' : s === 'researching' ? '🔬' : '⚡'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks count + auth */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="shopee-agent-tasks">
                <span className="shopee-agent-tasks-count">{agent.tasksCompleted}</span>
                <span>{t.tasks}</span>
              </div>

              {agent.authStatus === 'pending' && (
                <div className="flex items-center gap-1">
                  <button
                    className="shopee-agent-action-btn approve"
                    title={t.approve}
                    onClick={() => onApproveAgent(agent.agentId)}
                  >
                    <CheckCircle className="w-3 h-3" />
                  </button>
                  <button
                    className="shopee-agent-action-btn reject"
                    title={t.reject}
                    onClick={() => onRejectAgent(agent.agentId)}
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </div>
              )}
              {agent.authStatus === 'pending' && (
                <span className="text-[9px] text-yellow-500 font-mono">{t.pending}</span>
              )}
              {agent.authStatus === 'offline' && (
                <span className="text-[9px] text-gray-500 font-mono">{t.offline}</span>
              )}
              {agent.authStatus === 'approved' && (
                <span className="text-[8px] text-green-500/60 font-mono">✓</span>
              )}
            </div>
          </motion.div>
        ))}

        {agents.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-xs font-mono">
            No agents connected...
          </div>
        )}
      </div>
    </motion.div>
  )
}
