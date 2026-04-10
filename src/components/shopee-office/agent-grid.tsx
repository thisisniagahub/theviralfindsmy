'use client'

import { motion } from 'framer-motion'
import { Shield, Zap, Brain, Wrench } from 'lucide-react'

// ===== Agent Colors Map =====
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

// ===== Agent Roles Map =====
const AGENT_ROLES: Record<string, { en: string; cn: string; jp: string }> = {
  'product-scout': { en: 'Trending Scanner', cn: '趋势扫描器', jp: 'トレンドスキャナー' },
  'link-builder': { en: 'Affiliate Link Creator', cn: '联盟链接创建者', jp: 'アフィリエイトリンク作成' },
  'campaign-master': { en: 'Campaign Strategist', cn: '活动策略师', jp: 'キャンペーン戦略家' },
  'analytics-agent': { en: 'Data Analyst', cn: '数据分析师', jp: 'データアナリスト' },
  'content-writer': { en: 'Content Creator', cn: '内容创作者', jp: 'コンテンツクリエイター' },
  'payout-checker': { en: 'Revenue Tracker', cn: '收入追踪器', jp: '収益トラッカー' },
  'seo-optimizer': { en: 'SEO Specialist', cn: 'SEO 专家', jp: 'SEOスペシャリスト' },
  'review-monitor': { en: 'Review Analyst', cn: '评论分析师', jp: 'レビューアナリスト' },
}

// ===== Status Colors =====
const STATUS_COLORS: Record<string, string> = {
  idle: '#22c55e',
  writing: '#f97316',
  researching: '#a855f7',
  executing: '#eab308',
  syncing: '#3b82f6',
  error: '#ef4444',
}

// ===== Translations =====
const translations = {
  en: { selectAgent: 'SELECT AGENT', chooseAgent: 'CHOOSE YOUR AGENT', online: 'ONLINE', agents: 'AGENTS' },
  cn: { selectAgent: '选择代理', chooseAgent: '选择你的代理', online: '在线', agents: '代理' },
  jp: { selectAgent: 'エージェント選択', chooseAgent: 'エージェントを選択', online: 'オンライン', agents: 'エージェント' },
}

// ===== Types =====
export interface AgentGridAgent {
  agentId: string
  name: string
  emoji: string
  status: 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error'
  detail: string
  tasksCompleted: number
  authStatus: 'approved' | 'pending' | 'offline'
}

interface AgentGridProps {
  agents: AgentGridAgent[]
  onSelectAgent: (agentId: string) => void
  selectedAgentId: string | null
  language: 'en' | 'cn' | 'jp'
}

// ===== Status Dot Component =====
function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.idle
  const isWorking = status !== 'idle'

  return (
    <span className="relative flex items-center justify-center" style={{ width: 10, height: 10 }}>
      {isWorking && (
        <motion.span
          className="absolute rounded-full"
          style={{
            width: 10,
            height: 10,
            background: color,
            opacity: 0.4,
          }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span
        className="rounded-full relative z-10"
        style={{
          width: 8,
          height: 8,
          background: color,
          border: '1.5px solid #0a0e1a',
          boxShadow: `0 0 4px ${color}88`,
        }}
      />
    </span>
  )
}

// ===== Task Badge Component =====
function TasksBadge({ count, color }: { count: number; color: string }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center"
      style={{
        width: 22,
        height: 22,
        background: color,
        borderRadius: 3,
        border: '2px solid #0a0e1a',
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0a0e1a',
        boxShadow: `0 0 6px ${color}66`,
      }}
    >
      {count > 99 ? '99' : count}
    </motion.div>
  )
}

// ===== Pixel Corner Decorations =====
function PixelCorners({ color }: { color: string }) {
  const cornerSize = 6
  const cornerBorder = 2
  return (
    <>
      {/* Top-left */}
      <span
        className="absolute pointer-events-none"
        style={{
          top: -1,
          left: -1,
          width: cornerSize,
          height: cornerSize,
          borderTop: `${cornerBorder}px solid ${color}`,
          borderLeft: `${cornerBorder}px solid ${color}`,
        }}
      />
      {/* Top-right */}
      <span
        className="absolute pointer-events-none"
        style={{
          top: -1,
          right: -1,
          width: cornerSize,
          height: cornerSize,
          borderTop: `${cornerBorder}px solid ${color}`,
          borderRight: `${cornerBorder}px solid ${color}`,
        }}
      />
      {/* Bottom-left */}
      <span
        className="absolute pointer-events-none"
        style={{
          bottom: -1,
          left: -1,
          width: cornerSize,
          height: cornerSize,
          borderBottom: `${cornerBorder}px solid ${color}`,
          borderLeft: `${cornerBorder}px solid ${color}`,
        }}
      />
      {/* Bottom-right */}
      <span
        className="absolute pointer-events-none"
        style={{
          bottom: -1,
          right: -1,
          width: cornerSize,
          height: cornerSize,
          borderBottom: `${cornerBorder}px solid ${color}`,
          borderRight: `${cornerBorder}px solid ${color}`,
        }}
      />
    </>
  )
}

// ===== Agent Card Component =====
function AgentCard({
  agent,
  index,
  isSelected,
  onSelect,
  language,
}: {
  agent: AgentGridAgent
  index: number
  isSelected: boolean
  onSelect: () => void
  language: 'en' | 'cn' | 'jp'
}) {
  const color = AGENT_COLORS[agent.agentId] || '#EE4D2D'
  const role = AGENT_ROLES[agent.agentId]?.[language] || AGENT_ROLES[agent.agentId]?.en || ''

  return (
    <motion.button
      className="relative flex flex-col items-center cursor-pointer outline-none"
      style={{
        padding: '12px 8px 10px',
        background: isSelected ? `${color}0D` : '#0d1020',
        border: isSelected ? `3px solid ${color}` : '3px solid #1e2235',
        borderRadius: 6,
        minWidth: 0,
        textAlign: 'center',
      }}
      initial={{ opacity: 0, scale: 0.3, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: index * 0.05,
      }}
      whileHover={{
        scale: 1.05,
        borderColor: color,
        background: `${color}0A`,
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      aria-label={`Select ${agent.name}`}
      aria-pressed={isSelected}
    >
      {/* Selected glow effect */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{
            boxShadow: `0 0 12px ${color}66, 0 0 24px ${color}33, inset 0 0 12px ${color}0A`,
          }}
          animate={{
            boxShadow: [
              `0 0 12px ${color}66, 0 0 24px ${color}33, inset 0 0 12px ${color}0A`,
              `0 0 18px ${color}88, 0 0 32px ${color}44, inset 0 0 18px ${color}15`,
              `0 0 12px ${color}66, 0 0 24px ${color}33, inset 0 0 12px ${color}0A`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Pixel corners */}
      <PixelCorners color={isSelected ? color : '#2a3050'} />

      {/* Tasks badge */}
      <TasksBadge count={agent.tasksCompleted} color={color} />

      {/* Avatar area */}
      <div
        className="relative flex items-center justify-center mb-2"
        style={{
          width: 72,
          height: 72,
          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
          borderRadius: 4,
          border: `2px solid ${isSelected ? color : '#1a1e30'}`,
        }}
      >
        {/* Status ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 64,
            height: 64,
            border: `2px solid ${STATUS_COLORS[agent.status] || STATUS_COLORS.idle}`,
            opacity: agent.status !== 'idle' ? 0.5 : 0.2,
          }}
          animate={
            agent.status !== 'idle'
              ? {
                  scale: [1, 1.08, 1],
                  opacity: [0.5, 0.8, 0.5],
                }
              : undefined
          }
          transition={
            agent.status !== 'idle'
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        />

        {/* Emoji */}
        <motion.span
          style={{ fontSize: 36, lineHeight: 1 }}
          animate={
            agent.status === 'error'
              ? { x: [0, -2, 2, -1, 0], rotate: [0, -3, 3, -1, 0] }
              : agent.status === 'idle'
                ? { y: [0, -2, 0] }
                : undefined
          }
          transition={
            agent.status === 'error'
              ? { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
              : agent.status === 'idle'
                ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                : undefined
          }
        >
          {agent.emoji}
        </motion.span>
      </div>

      {/* Status dot */}
      <div className="flex items-center justify-center mb-1.5">
        <StatusDot status={agent.status} />
      </div>

      {/* Agent name */}
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          fontWeight: 'bold',
          color: isSelected ? color : '#e0e0e0',
          letterSpacing: 0.5,
          textShadow: isSelected ? `0 0 8px ${color}66` : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {agent.name}
      </div>

      {/* Role subtitle */}
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 9,
          color: '#555',
          letterSpacing: 0.3,
          marginTop: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {role}
      </div>
    </motion.button>
  )
}

// ===== Main Grid Component =====
export function AgentGrid({ agents, onSelectAgent, selectedAgentId, language }: AgentGridProps) {
  const t = translations[language]
  const selectedAgent = agents.find((a) => a.agentId === selectedAgentId)
  const canSelect = selectedAgentId !== null

  const handleSelectClick = () => {
    if (canSelect && selectedAgentId) {
      onSelectAgent(selectedAgentId)
    }
  }

  return (
    <div
      className="relative w-full"
      style={{
        fontFamily: "'Courier New', monospace",
        background: 'linear-gradient(180deg, #0a0e1a 0%, #1a1e2e 100%)',
        borderRadius: 8,
        padding: '20px 16px 16px',
        overflow: 'hidden',
        border: '3px solid #EE4D2D',
        boxShadow: '0 0 0 1px #7a2210, 0 0 20px rgba(238, 77, 45, 0.2)',
      }}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(238, 77, 45, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(238, 77, 45, 0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Corner decorations */}
      <PixelCorners color="#EE4D2D" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Shield size={14} style={{ color: '#EE4D2D' }} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 'bold',
                color: '#EE4D2D',
                letterSpacing: 2,
                textShadow: '0 0 8px rgba(238, 77, 45, 0.4)',
              }}
            >
              {t.chooseAgent}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Zap size={12} style={{ color: '#FFB300' }} />
            <span style={{ fontSize: 10, color: '#888', letterSpacing: 1 }}>
              {agents.filter((a) => a.status !== 'idle').length}/{agents.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Brain size={12} style={{ color: '#7C4DFF' }} />
            <span style={{ fontSize: 10, color: '#888', letterSpacing: 1 }}>
              {t.agents}
            </span>
          </div>
        </div>
      </div>

      {/* Agent grid */}
      <div
        className="relative z-10 grid gap-3 mb-5 agent-grid-responsive"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        {agents.map((agent, index) => (
          <AgentCard
            key={agent.agentId}
            agent={agent}
            index={index}
            isSelected={selectedAgentId === agent.agentId}
            onSelect={() => onSelectAgent(agent.agentId)}
            language={language}
          />
        ))}

        {/* Empty slot (9th cell for 3x3) */}
        <div
          className="relative flex items-center justify-center"
          style={{
            padding: '12px 8px 10px',
            background: '#080b14',
            border: '2px dashed #1a1e30',
            borderRadius: 6,
            minHeight: 120,
          }}
        >
          <div className="flex flex-col items-center gap-1 opacity-30">
            <Wrench size={20} style={{ color: '#333' }} />
            <span style={{ fontSize: 8, color: '#333', letterSpacing: 1 }}>EMPTY</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="relative z-10 mb-4"
        style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, #EE4D2D33, transparent)',
        }}
      />

      {/* Selected agent info */}
      {selectedAgent && (
        <motion.div
          className="relative z-10 flex items-center gap-3 mb-4 px-3 py-2"
          style={{
            background: `${AGENT_COLORS[selectedAgent.agentId] || '#EE4D2D'}0D`,
            border: `1px solid ${AGENT_COLORS[selectedAgent.agentId] || '#EE4D2D'}33`,
            borderRadius: 4,
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <span style={{ fontSize: 20 }}>{selectedAgent.emoji}</span>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 12, fontWeight: 'bold', color: AGENT_COLORS[selectedAgent.agentId] || '#EE4D2D' }}>
              {selectedAgent.name}
            </div>
            <div style={{ fontSize: 9, color: '#666', fontFamily: "'Courier New', monospace" }}>
              {selectedAgent.detail}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={selectedAgent.status} />
            <span style={{ fontSize: 9, color: '#888' }}>
              {selectedAgent.tasksCompleted} tasks
            </span>
          </div>
        </motion.div>
      )}

      {/* SELECT AGENT Button */}
      <motion.button
        className="relative z-10 w-full cursor-pointer"
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 14,
          fontWeight: 'bold',
          letterSpacing: 3,
          color: canSelect ? '#0a0e1a' : '#333',
          background: canSelect ? '#FFD700' : '#1a1e30',
          border: `3px solid ${canSelect ? '#3B82F6' : '#1a1e30'}`,
          borderRadius: 4,
          padding: '10px 16px',
          cursor: canSelect ? 'pointer' : 'not-allowed',
          boxShadow: canSelect
            ? '0 2px 0 #1a3a8a, 0 4px 12px rgba(238, 77, 45, 0.15)'
            : 'none',
          textShadow: canSelect ? 'none' : 'none',
          transition: 'background 0.2s, border-color 0.2s',
          imageRendering: 'pixelated',
        }}
        whileHover={
          canSelect
            ? {
                y: -2,
                boxShadow: '0 4px 0 #1a3a8a, 0 8px 24px rgba(238, 77, 45, 0.3)',
              }
            : undefined
        }
        whileTap={
          canSelect
            ? {
                y: 1,
                boxShadow: '0 1px 0 #1a3a8a, 0 2px 6px rgba(238, 77, 45, 0.1)',
              }
            : undefined
        }
        onClick={handleSelectClick}
        disabled={!canSelect}
        aria-label={t.selectAgent}
      >
        {/* Button pixel corners */}
        <PixelCorners color={canSelect ? '#3B82F6' : '#1a1e30'} />

        {/* Inner glow line */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: 2,
            background: canSelect
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)'
              : 'transparent',
            borderRadius: '2px 2px 0 0',
          }}
        />

        <span className="relative z-10">
          {selectedAgent ? (
            <span className="flex items-center justify-center gap-2">
              <span>{t.selectAgent}</span>
              <span style={{ fontSize: 16 }}>{selectedAgent.emoji}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 opacity-50">
              <Wrench size={14} />
              <span>{t.selectAgent}</span>
            </span>
          )}
        </span>
      </motion.button>

      {/* Responsive overrides via CSS-in-JS media queries */}
      <style>{`
        @media (max-width: 640px) {
          .agent-grid-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
