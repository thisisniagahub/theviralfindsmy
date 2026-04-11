'use client'

import { motion } from 'framer-motion'
import type { Language } from './language-toggle'

interface MemoPanelProps {
  memo: MemoData | null
  isLoading: boolean
  language: Language
}

export interface MemoData {
  date: string
  title: string
  content: string
  summary: {
    totalTasks: number
    completedTasks: number
    errorCount: number
    agentHighlights: { agent: string; tasks: number; status: string }[]
  }
}

const translations = {
  en: {
    title: "📝 Yesterday's Memo",
    loading: 'Loading memo...',
    noMemo: 'No memo available yet.',
    totalTasks: 'Total Tasks',
    completed: 'Completed',
    errors: 'Errors',
    highlights: 'Agent Highlights',
    signed: '— Shopee Office System',
  },
  cn: {
    title: '📝 昨日备忘录',
    loading: '加载备忘录...',
    noMemo: '暂无备忘录。',
    totalTasks: '总任务',
    completed: '已完成',
    errors: '错误',
    highlights: '代理亮点',
    signed: '— Shopee 办公系统',
  },
  jp: {
    title: '📝 昨日のメモ',
    loading: 'メモを読み込み中...',
    noMemo: 'メモはまだありません。',
    totalTasks: '総タスク',
    completed: '完了',
    errors: 'エラー',
    highlights: 'エージェントハイライト',
    signed: '— Shopee オフィスシステム',
  },
}

function formatMemoContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return <h3 key={i} className="text-sm font-bold mt-3 mb-1 text-[#4a3d28]">{line.replace('## ', '')}</h3>
    }
    if (line.startsWith('- ')) {
      return (
        <li key={i} className="ml-3 text-xs text-[#5c4a2a] list-disc">
          {line.replace('- ', '')}
        </li>
      )
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />
    }
    return <p key={i} className="text-xs text-[#5c4a2a]">{line}</p>
  })
}

export function MemoPanel({ memo, isLoading, language }: MemoPanelProps) {
  const t = translations[language]

  return (
    <motion.div
      className="shopee-office-panel shopee-memo-panel shopee-panel-memo"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="shopee-panel-title">{t.title}</div>

      {isLoading && (
        <div className="text-center py-8 text-sm text-gray-500 font-mono animate-pulse">
          {t.loading}
        </div>
      )}

      {!isLoading && !memo && (
        <div className="text-center py-8 text-sm text-gray-500 font-mono italic">
          {t.noMemo}
        </div>
      )}

      {!isLoading && memo && (
        <div className="shopee-memo-content">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-[#c4b48e]/50">
            <div className="text-center">
              <div className="text-lg font-bold text-[#3b3b32]">{memo.summary.totalTasks}</div>
              <div className="text-[9px] text-[#8b7355]">{t.totalTasks}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">{memo.summary.completedTasks}</div>
              <div className="text-[9px] text-[#8b7355]">{t.completed}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-700">{memo.summary.errorCount}</div>
              <div className="text-[9px] text-[#8b7355]">{t.errors}</div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {formatMemoContent(memo.content)}
          </div>

          {/* Agent Highlights */}
          {memo.summary.agentHighlights.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#c4b48e]/50">
              <h4 className="text-[10px] font-bold text-[#4a3d28] mb-2">{t.highlights}</h4>
              <div className="space-y-1">
                {memo.summary.agentHighlights.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-[#5c4a2a]">{h.agent}</span>
                    <span className="text-[#8b7355]">
                      {h.tasks} {language === 'cn' ? '任务' : language === 'jp' ? 'タスク' : 'tasks'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date / Signature */}
          <div className="shopee-memo-date">
            <div>{memo.date}</div>
            <div className="italic mt-1">{t.signed}</div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
