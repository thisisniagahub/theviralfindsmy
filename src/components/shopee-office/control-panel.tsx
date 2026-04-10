'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Pause, Play } from 'lucide-react'
import type { Language } from './language-toggle'

type AgentStatus = 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error'

interface ControlPanelProps {
  activeStatus: AgentStatus | null
  isPaused: boolean
  onSetAllStatus: (status: AgentStatus) => void
  onTogglePause: () => void
  language: Language
}

const translations = {
  en: { title: '🛒 Agent Control', hint: 'Set all agents to status:', shortcut: 'Keys 1-6, Space=Pause' },
  cn: { title: '🛒 代理控制', hint: '设置所有代理状态：', shortcut: '按键1-6，空格=暂停' },
  jp: { title: '🛒 エージェント制御', hint: '全エージェントの状態を設定：', shortcut: 'キー1-6、スペース=一時停止' },
}

const statuses: { key: AgentStatus; emoji: string; label: string; btnClass: string; shortcut: string }[] = [
  { key: 'idle', emoji: '🛋', label: 'Idle', btnClass: 'shopee-btn-idle', shortcut: '1' },
  { key: 'writing', emoji: '💻', label: 'Writing', btnClass: 'shopee-btn-writing', shortcut: '2' },
  { key: 'researching', emoji: '🔬', label: 'Research', btnClass: 'shopee-btn-researching', shortcut: '3' },
  { key: 'executing', emoji: '⚡', label: 'Execute', btnClass: 'shopee-btn-executing', shortcut: '4' },
  { key: 'syncing', emoji: '🔄', label: 'Sync', btnClass: 'shopee-btn-syncing', shortcut: '5' },
  { key: 'error', emoji: '🐛', label: 'Error', btnClass: 'shopee-btn-error', shortcut: '6' },
]

export function ControlPanel({ activeStatus, isPaused, onSetAllStatus, onTogglePause, language }: ControlPanelProps) {
  const t = translations[language]

  return (
    <motion.div
      className="shopee-office-panel shopee-panel-control"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="shopee-panel-title">{t.title}</div>

      <p className="text-[10px] text-gray-500 mb-2 font-mono">{t.hint}</p>

      <div className="shopee-status-grid">
        {statuses.map((s) => (
          <button
            key={s.key}
            className={cn(
              'shopee-btn',
              s.btnClass,
              activeStatus === s.key && 'shopee-btn-active',
            )}
            onClick={() => onSetAllStatus(s.key)}
          >
            <span className="flex items-center gap-1">
              <span>{s.emoji}</span>
              <span>{s.label}</span>
              <span className="shopee-shortcut-hint">{s.shortcut}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Shopee Affiliate Quick Stats */}
      <div className="mt-3 pt-3 border-t border-gray-800">
        <div className="shopee-productivity-grid">
          <div className="shopee-productivity-card">
            <div className="shopee-productivity-value" style={{ color: '#EE4D2D' }}>RM 4.2K</div>
            <div className="shopee-productivity-label">Commission</div>
          </div>
          <div className="shopee-productivity-card">
            <div className="shopee-productivity-value" style={{ color: '#22c55e' }}>347</div>
            <div className="shopee-productivity-label">Conversions</div>
          </div>
          <div className="shopee-productivity-card">
            <div className="shopee-productivity-value" style={{ color: '#a855f7' }}>1.2K</div>
            <div className="shopee-productivity-label">Links Made</div>
          </div>
          <div className="shopee-productivity-card">
            <div className="shopee-productivity-value" style={{ color: '#f97316' }}>8.4%</div>
            <div className="shopee-productivity-label">CTR Rate</div>
          </div>
        </div>
      </div>

      {/* Pause / Play */}
      <div className="mt-3 pt-3 border-t border-gray-800">
        <button
          className="shopee-btn w-full flex items-center justify-center gap-2"
          onClick={onTogglePause}
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 text-yellow-500" />
              <span className="text-yellow-500">Pause</span>
            </>
          )}
        </button>
      </div>

      <p className="text-[9px] text-gray-600 mt-2 text-center font-mono">{t.shortcut}</p>
    </motion.div>
  )
}
