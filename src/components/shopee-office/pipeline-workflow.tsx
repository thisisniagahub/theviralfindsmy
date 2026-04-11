'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import type { Language } from './language-toggle'

// ===== Types =====
interface PipelineWorkflowProps {
  agents: Array<{
    agentId: string
    name: string
    emoji: string
    status: string
    detail: string
  }>
  language: Language
}

// ===== Pipeline Stages =====
const PIPELINE_STAGES = [
  {
    id: 'research',
    label: { en: 'Research', cn: '研究', jp: '調査' },
    agentIds: ['product-scout', 'analytics-agent'],
    icon: '🔬',
    color: '#a855f7',
  },
  {
    id: 'create',
    label: { en: 'Create', cn: '创建', jp: '作成' },
    agentIds: ['content-writer', 'link-builder'],
    icon: '✍️',
    color: '#f97316',
  },
  {
    id: 'optimize',
    label: { en: 'Optimize', cn: '优化', jp: '最適化' },
    agentIds: ['seo-optimizer', 'campaign-master'],
    icon: '⚙️',
    color: '#eab308',
  },
  {
    id: 'execute',
    label: { en: 'Execute', cn: '执行', jp: '実行' },
    agentIds: ['review-monitor', 'payout-checker'],
    icon: '⚡',
    color: '#22c55e',
  },
]

// ===== Translations =====
const translations = {
  en: {
    title: 'A2A Pipeline',
    subtitle: 'Agent-to-Agent Workflow',
    active: 'Active',
    idle: 'Idle',
    error: 'Error',
    throughput: 'Throughput',
  },
  cn: {
    title: 'A2A 流水线',
    subtitle: '代理间工作流',
    active: '活跃',
    idle: '空闲',
    error: '错误',
    throughput: '吞吐量',
  },
  jp: {
    title: 'A2A パイプライン',
    subtitle: 'エージェント間ワークフロー',
    active: 'アクティブ',
    idle: 'アイドル',
    error: 'エラー',
    throughput: 'スループット',
  },
}

// ===== Pipeline Node =====
function PipelineNode({
  stage,
  agents,
  isActive,
  language,
}: {
  stage: typeof PIPELINE_STAGES[0]
  agents: PipelineWorkflowProps['agents']
  isActive: boolean
  language: Language
}) {
  const stageAgents = agents.filter((a) => stage.agentIds.includes(a.agentId))
  const hasError = stageAgents.some((a) => a.status === 'error')
  const allIdle = stageAgents.every((a) => a.status === 'idle')

  return (
    <div className="flex flex-col items-center" style={{ minWidth: 120 }}>
      {/* Node circle */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: hasError
            ? 'rgba(239,68,68,0.15)'
            : allIdle
              ? 'rgba(34,197,94,0.08)'
              : `${stage.color}15`,
          border: `2px solid ${hasError ? '#ef444488' : allIdle ? '#22c55e33' : `${stage.color}66`}`,
          boxShadow: isActive && !allIdle
            ? `0 0 16px ${stage.color}33, inset 0 0 12px ${stage.color}08`
            : 'none',
        }}
        animate={isActive && !allIdle ? {
          boxShadow: [
            `0 0 16px ${stage.color}33, inset 0 0 12px ${stage.color}08`,
            `0 0 24px ${stage.color}55, inset 0 0 18px ${stage.color}12`,
            `0 0 16px ${stage.color}33, inset 0 0 12px ${stage.color}08`,
          ],
        } : undefined}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span style={{ fontSize: 24 }}>{stage.icon}</span>

        {/* Status indicator */}
        <div className="absolute -top-1 -right-1">
          {hasError ? (
            <AlertCircle size={14} style={{ color: '#ef4444' }} />
          ) : allIdle ? (
            <CheckCircle2 size={14} style={{ color: '#22c55e88' }} />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={14} style={{ color: stage.color }} />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Label */}
      <div style={{
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color: hasError ? '#ef4444' : allIdle ? '#666' : stage.color,
        marginTop: 6,
        letterSpacing: 0.5,
      }}>
        {stage.label[language as 'en' | 'cn' | 'jp']}
      </div>

      {/* Agent names */}
      <div className="mt-1 space-y-0.5">
        {stageAgents.map((agent) => (
          <div key={agent.agentId} className="flex items-center gap-1 justify-center">
            <span style={{ fontSize: 9 }}>{agent.emoji}</span>
            <span style={{
              fontSize: 8,
              fontFamily: 'monospace',
              color: agent.status === 'error' ? '#ef4444' : agent.status === 'idle' ? '#555' : '#aaa',
            }}>
              {agent.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Pipeline Arrow =====
function PipelineArrow({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center" style={{ marginBottom: 40 }}>
      <motion.div
        style={{
          width: 32,
          height: 2,
          background: active ? color : '#1a1e2e',
          borderRadius: 1,
          position: 'relative',
        }}
        animate={active ? {
          background: [color, `${color}44`, color],
        } : undefined}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {/* Data flow dots */}
        {active && (
          <motion.div
            style={{
              position: 'absolute',
              top: -2,
              width: 6,
              height: 6,
              borderRadius: 3,
              background: color,
              boxShadow: `0 0 6px ${color}`,
            }}
            animate={{ left: ['-6px', '32px'] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeIn' }}
          />
        )}
      </motion.div>
      <ArrowRight size={12} style={{ color: active ? color : '#2a2d3e', flexShrink: 0 }} />
    </div>
  )
}

// ===== Component =====
export function PipelineWorkflow({ agents, language }: PipelineWorkflowProps) {
  const [throughput, setThroughput] = useState(0)
  const t = translations[language]

  const activeAgents = agents.filter((a) => a.status !== 'idle' && a.status !== 'error')
  const pipelineActive = activeAgents.length > 0

  // Simulate throughput counter
  useEffect(() => {
    const interval = setInterval(() => {
      setThroughput((prev) => prev + (pipelineActive ? Math.floor(Math.random() * 3) + 1 : 0))
    }, 2000)

    return () => clearInterval(interval)
  }, [pipelineActive])

  return (
    <motion.div
      className="shopee-office-panel"
      style={{ flex: '1 1 100%', minWidth: 0 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <div className="shopee-panel-title flex items-center justify-between">
        <span className="flex items-center gap-2">
          🔗 {t.title}
          <span style={{ fontSize: 8, color: '#555', letterSpacing: 0.5, fontWeight: 'normal' }}>
            {t.subtitle}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace' }}>{t.throughput}:</span>
          <motion.span
            key={throughput}
            initial={{ scale: 1.2, color: '#FFD700' }}
            animate={{ scale: 1, color: '#aaa' }}
            style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' }}
          >
            {throughput}
          </motion.span>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="flex items-center justify-center gap-0 py-4 overflow-x-auto">
        {PIPELINE_STAGES.map((stage, idx) => (
          <div key={stage.id} className="flex items-center">
            <PipelineNode
              stage={stage}
              agents={agents}
              isActive={pipelineActive}
              language={language}
            />
            {idx < PIPELINE_STAGES.length - 1 && (
              <PipelineArrow
                active={pipelineActive}
                color={stage.color}
              />
            )}
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-center gap-4 mt-2 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: pipelineActive ? '#22c55e' : '#555', animation: pipelineActive ? 'dotPulse 1.5s ease-in-out infinite' : 'none' }} />
          <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace' }}>
            {pipelineActive ? t.active : t.idle}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 9, color: '#666', fontFamily: 'monospace' }}>
            {activeAgents.length}/{agents.length} agents
          </span>
        </div>
      </div>
    </motion.div>
  )
}
