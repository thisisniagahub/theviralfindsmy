'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Zap, Clock } from 'lucide-react'
import type { Language } from './language-toggle'

// ===== Types =====
type AgentStatus = 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error'

export interface ProfileAgent {
  agentId: string
  name: string
  emoji: string
  status: AgentStatus
  detail: string
  tasksCompleted: number
  authStatus: 'approved' | 'pending' | 'offline'
}

interface AgentProfileProps {
  agent: ProfileAgent | null
  onBack: () => void
  onSetAgentStatus: (agentId: string, status: AgentStatus) => void
  language: Language
}

// ===== Agent-Specific Profile Data =====
const AGENT_PROFILES: Record<string, {
  role: string
  description: string
  stats: { label: string; value: number; max: number; color: string }[]
  equipment: { name: string; icon: string; description: string }[]
  skills: string[]
  recentActivities: { text: string; time: string; type: 'success' | 'info' | 'warning' }[]
}> = {
  'product-scout': {
    role: 'Trending Scanner',
    description: 'Scans Shopee for trending products and flash sale opportunities',
    stats: [
      { label: 'Scan Speed', value: 92, max: 100, color: '#22c55e' },
      { label: 'Accuracy', value: 88, max: 100, color: '#06b6d4' },
      { label: 'Products Found', value: 1247, max: 2000, color: '#f97316' },
    ],
    equipment: [
      { name: 'Trend Radar', icon: '📡', description: 'Real-time trending detection' },
      { name: 'Price Scanner', icon: '💸', description: 'Price comparison engine' },
    ],
    skills: ['Trend Analysis', 'Flash Sale Detection', 'Category Scanning'],
    recentActivities: [
      { text: 'Found 15 trending items in Electronics', time: '2m ago', type: 'success' },
      { text: 'Alert: Flash Sale starting in 30min', time: '5m ago', type: 'warning' },
      { text: 'Updated product database', time: '12m ago', type: 'info' },
    ],
  },
  'link-builder': {
    role: 'Affiliate Link Creator',
    description: 'Generates optimized affiliate links with deep linking and tracking',
    stats: [
      { label: 'Links Created', value: 1847, max: 2000, color: '#22c55e' },
      { label: 'Success Rate', value: 96, max: 100, color: '#06b6d4' },
      { label: 'Avg Response', value: 85, max: 100, color: '#f97316' },
    ],
    equipment: [
      { name: 'Deep Link Engine', icon: '🔗', description: 'Multi-level deep linking' },
      { name: 'Link Validator', icon: '✅', description: 'Auto link verification' },
    ],
    skills: ['Deep Linking', 'URL Shortening', 'Link Tracking'],
    recentActivities: [
      { text: 'Created 5 deep links for campaign', time: '1m ago', type: 'success' },
      { text: 'Validated 23 existing links', time: '8m ago', type: 'info' },
      { text: 'Fixed broken link: Phone Case #A12', time: '15m ago', type: 'warning' },
    ],
  },
  'campaign-master': {
    role: 'Campaign Strategist',
    description: 'Designs and manages affiliate campaigns with A/B testing',
    stats: [
      { label: 'Campaigns Active', value: 8, max: 10, color: '#22c55e' },
      { label: 'ROI Score', value: 94, max: 100, color: '#06b6d4' },
      { label: 'Budget Usage', value: 72, max: 100, color: '#f97316' },
    ],
    equipment: [
      { name: 'Strategy Board', icon: '🎯', description: 'Campaign planning tool' },
      { name: 'A/B Tester', icon: '⚖️', description: 'Automated split testing' },
    ],
    skills: ['Campaign Design', 'A/B Testing', 'Budget Optimization'],
    recentActivities: [
      { text: 'Launched "9.9 Mega Sale" campaign', time: '3m ago', type: 'success' },
      { text: 'A/B test results: Variant B +12% CTR', time: '20m ago', type: 'info' },
      { text: 'Budget alert: 72% used this month', time: '1h ago', type: 'warning' },
    ],
  },
  'analytics-agent': {
    role: 'Data Analyst',
    description: 'Processes affiliate performance data and generates actionable insights',
    stats: [
      { label: 'Processing Power', value: 97, max: 100, color: '#22c55e' },
      { label: 'Data Accuracy', value: 91, max: 100, color: '#06b6d4' },
      { label: 'Reports Generated', value: 342, max: 500, color: '#f97316' },
    ],
    equipment: [
      { name: 'Data Lens', icon: '🔍', description: 'Deep data inspection tool' },
      { name: 'Chart Forge', icon: '📊', description: 'Auto chart generation' },
    ],
    skills: ['Data Mining', 'Report Generation', 'Predictive Analytics'],
    recentActivities: [
      { text: 'Generated weekly performance report', time: '4m ago', type: 'success' },
      { text: 'Detected anomaly in click-through data', time: '18m ago', type: 'warning' },
      { text: 'Updated dashboard metrics', time: '35m ago', type: 'info' },
    ],
  },
  'content-writer': {
    role: 'Content Creator',
    description: 'Writes compelling product descriptions and promotional content',
    stats: [
      { label: 'Writing Speed', value: 89, max: 100, color: '#22c55e' },
      { label: 'Engagement Score', value: 93, max: 100, color: '#06b6d4' },
      { label: 'Posts Created', value: 567, max: 800, color: '#f97316' },
    ],
    equipment: [
      { name: 'Content Forge', icon: '✍️', description: 'AI-powered content generation' },
      { name: 'Keyword Tool', icon: '🏷️', description: 'SEO keyword research' },
    ],
    skills: ['Copywriting', 'SEO Content', 'Social Media'],
    recentActivities: [
      { text: 'Published 3 product descriptions', time: '2m ago', type: 'success' },
      { text: 'Optimized IG caption for Beauty set', time: '10m ago', type: 'info' },
      { text: 'Grammar check: 2 issues fixed', time: '25m ago', type: 'warning' },
    ],
  },
  'payout-checker': {
    role: 'Revenue Tracker',
    description: 'Monitors commissions, processes payouts, and tracks revenue flow',
    stats: [
      { label: 'Tracking Accuracy', value: 99, max: 100, color: '#22c55e' },
      { label: 'Payouts Processed', value: 186, max: 250, color: '#06b6d4' },
      { label: 'Commission Rate', value: 78, max: 100, color: '#f97316' },
    ],
    equipment: [
      { name: 'Revenue Shield', icon: '🛡️', description: 'Fraud detection system' },
      { name: 'Payment Gate', icon: '🏦', description: 'Secure payment processing' },
    ],
    skills: ['Revenue Analysis', 'Payment Tracking', 'Commission Calc'],
    recentActivities: [
      { text: 'Processed RM 2,340 payout batch', time: '6m ago', type: 'success' },
      { text: 'Verified 45 commission entries', time: '22m ago', type: 'info' },
      { text: 'Flagged suspicious transaction #8901', time: '45m ago', type: 'warning' },
    ],
  },
  'seo-optimizer': {
    role: 'SEO Specialist',
    description: 'Optimizes affiliate content for search engines and organic traffic',
    stats: [
      { label: 'SEO Score', value: 88, max: 100, color: '#22c55e' },
      { label: 'Keywords Ranked', value: 156, max: 200, color: '#06b6d4' },
      { label: 'Traffic Boost', value: 64, max: 100, color: '#f97316' },
    ],
    equipment: [
      { name: 'SEO Blade', icon: '⚔️', description: 'On-page SEO optimizer' },
      { name: 'Rank Tracker', icon: '📈', description: 'Keyword rank monitoring' },
    ],
    skills: ['Keyword Research', 'On-page SEO', 'Rank Tracking'],
    recentActivities: [
      { text: 'Boosted 5 keywords to top 10', time: '5m ago', type: 'success' },
      { text: 'Updated meta tags for 12 products', time: '30m ago', type: 'info' },
      { text: 'Core Web Vitals: 2 pages need fix', time: '1h ago', type: 'warning' },
    ],
  },
  'review-monitor': {
    role: 'Review Analyst',
    description: 'Tracks product reviews, analyzes sentiment, and alerts on feedback',
    stats: [
      { label: 'Reviews Tracked', value: 934, max: 1200, color: '#22c55e' },
      { label: 'Sentiment Score', value: 87, max: 100, color: '#06b6d4' },
      { label: 'Alert Speed', value: 95, max: 100, color: '#f97316' },
    ],
    equipment: [
      { name: 'Review Radar', icon: '🎙️', description: 'Real-time review detection' },
      { name: 'Sentiment Core', icon: '💚', description: 'AI sentiment analysis' },
    ],
    skills: ['Review Analysis', 'Sentiment Tracking', 'Alert System'],
    recentActivities: [
      { text: 'Positive spike: Wireless Buds ★4.8', time: '1m ago', type: 'success' },
      { text: 'Analyzed 28 new reviews', time: '15m ago', type: 'info' },
      { text: 'Negative alert: 3 ⭐ reviews on Charger', time: '40m ago', type: 'warning' },
    ],
  },
}

// ===== Status Colors =====
const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: '#22c55e',
  writing: '#f97316',
  researching: '#a855f7',
  executing: '#eab308',
  syncing: '#3b82f6',
  error: '#ef4444',
}

// ===== Translations =====
const translations = {
  en: {
    back: 'BACK',
    stats: 'AGENT STATS',
    equipment: 'EQUIPMENT',
    skills: 'SKILLS',
    recentActivities: 'RECENT ACTIVITIES',
    skillEnhancement: '⚡ Skill Enhancement',
    viewMissionHistory: '📜 View Mission History',
    tasksCompleted: 'TASKS COMPLETED',
    status: 'STATUS',
    authStatus: 'AUTH',
    description: 'DESCRIPTION',
  },
  cn: {
    back: '返回',
    stats: '代理属性',
    equipment: '装备',
    skills: '技能',
    recentActivities: '最近活动',
    skillEnhancement: '⚡ 技能提升',
    viewMissionHistory: '📜 查看任务历史',
    tasksCompleted: '已完成任务',
    status: '状态',
    authStatus: '授权',
    description: '描述',
  },
  jp: {
    back: '戻る',
    stats: 'エージェント属性',
    equipment: '装備',
    skills: 'スキル',
    recentActivities: '最近の活動',
    skillEnhancement: '⚡ スキル強化',
    viewMissionHistory: '📜 ミッション履歴',
    tasksCompleted: '完了タスク',
    status: 'ステータス',
    authStatus: '認証',
    description: '説明',
  },
}

const statusLabels: Record<string, Record<Language, string>> = {
  idle: { en: 'Idle', cn: '空闲', jp: '待機' },
  writing: { en: 'Writing', cn: '写作中', jp: '執筆中' },
  researching: { en: 'Researching', cn: '研究中', jp: '調査中' },
  executing: { en: 'Executing', cn: '执行中', jp: '実行中' },
  syncing: { en: 'Syncing', cn: '同步中', jp: '同期中' },
  error: { en: 'Error', cn: '错误', jp: 'エラー' },
}

// ===== Pixel Corner SVG =====
function PixelCorner({ position, color }: { position: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const rotations: Record<string, string> = { tl: '', tr: 'rotate(90)', bl: 'rotate(-90)', br: 'rotate(180)' }
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      style={{ position: 'absolute', [position === 'tl' ? 'top' : position === 'tr' ? 'top' : 'bottom']: position === 'tl' || position === 'tr' ? '2px' : '2px', [position === 'tl' || position === 'bl' ? 'left' : 'right']: '2px', transform: rotations[position], pointerEvents: 'none', zIndex: 2 }}
    >
      <path d="M0 0 L0 12 L2 12 L2 2 L12 2 L12 0 Z" fill={color} />
    </svg>
  )
}

// ===== Animated Status Ring (SVG) =====
function StatusRing({ status, size = 100 }: { status: AgentStatus; size?: number }) {
  const color = STATUS_COLORS[status]
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const isActive = status !== 'idle'

  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      {/* Outer glow ring */}
      {isActive && (
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 2}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity={0.3}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{
            scale: [0.95, 1.05, 0.95],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, 360],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: 'center' }}
        />
      )}
      {/* Main ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={isActive ? `${circumference * 0.25} ${circumference * 0.75}` : `${circumference} 0`}
        strokeLinecap="butt"
        opacity={isActive ? 0.8 : 0.4}
      />
      {isActive && (
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
          strokeLinecap="butt"
          opacity={0.5}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: 'center' }}
        />
      )}
    </svg>
  )
}

// ===== Stat Bar Component =====
function StatBar({ label, value, max, color, index }: { label: string; value: number; max: number; color: string; index: number }) {
  const percentage = Math.min(100, (value / max) * 100)
  const displayValue = max <= 100 ? `${value}%` : `${value.toLocaleString()}/${max.toLocaleString()}`

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
      style={{ marginBottom: '10px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#999', letterSpacing: '0.5px' }}>
          {label.toUpperCase()}
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: color, fontWeight: 'bold' }}>
          {displayValue}
        </span>
      </div>
      <div style={{
        height: '8px',
        background: '#1a1e2e',
        borderRadius: '2px',
        border: '1px solid #2a2e3e',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Grid pattern on track */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '8px 100%',
        }} />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, delay: 0.6 + index * 0.15, ease: 'easeOut' }}
          style={{
            height: '100%',
            borderRadius: '1px',
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}66, inset 0 1px 0 rgba(255,255,255,0.2)`,
            position: 'relative',
          }}
        >
          {/* Shimmer effect */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
          }} />
        </motion.div>
      </div>
    </motion.div>
  )
}

// ===== Equipment Card Component =====
function EquipmentCard({ equipment, index }: { equipment: { name: string; icon: string; description: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.9 + index * 0.12 }}
      whileHover={{
        scale: 1.03,
        boxShadow: '0 0 16px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.05)',
      }}
      style={{
        flex: 1,
        minWidth: 0,
        background: '#12162a',
        border: '2px solid #7c3aed44',
        borderRadius: '6px',
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed99' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#7c3aed44' }}
    >
      {/* Purple glow accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)',
      }} />
      <div style={{ fontSize: '24px', marginBottom: '6px' }}>{equipment.icon}</div>
      <div style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#e0e0e0',
        fontWeight: 'bold',
        marginBottom: '2px',
        letterSpacing: '0.3px',
      }}>
        {equipment.name}
      </div>
      <div style={{
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#777',
        lineHeight: '1.4',
      }}>
        {equipment.description}
      </div>
    </motion.div>
  )
}

// ===== Activity Item Component =====
function ActivityItem({ activity, index }: { activity: { text: string; time: string; type: 'success' | 'info' | 'warning' }; index: number }) {
  const dotColor = activity.type === 'success' ? '#22c55e' : activity.type === 'warning' ? '#f97316' : '#3b82f6'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 1.3 + index * 0.08 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 8px',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        border: '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#1a1e30'
        e.currentTarget.style.borderColor = '#2a3045'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      <div style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: dotColor,
        boxShadow: `0 0 6px ${dotColor}88`,
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ccc',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {activity.text}
        </div>
      </div>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#555',
        flexShrink: 0,
      }}>
        {activity.time}
      </span>
      <ChevronRight size={12} color="#444" style={{ flexShrink: 0 }} />
    </motion.div>
  )
}

// ===== Section Header =====
function SectionHeader({ title, delay }: { title: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
      }}
    >
      <div style={{
        flex: 1,
        height: '1px',
        background: 'linear-gradient(90deg, #3B82F644, #3B82F611)',
      }} />
      <span style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3B82F6',
        fontWeight: 'bold',
        letterSpacing: '2px',
        textShadow: '0 0 8px rgba(59, 130, 246, 0.3)',
      }}>
        {title}
      </span>
      <div style={{
        flex: 1,
        height: '1px',
        background: 'linear-gradient(270deg, #3B82F644, #3B82F611)',
      }} />
    </motion.div>
  )
}

// ===== Main Component =====
export function AgentProfile({ agent, onBack, onSetAgentStatus, language }: AgentProfileProps) {
  if (!agent) return null

  const t = translations[language]
  const profile = AGENT_PROFILES[agent.agentId]
  const statusColor = STATUS_COLORS[agent.status]
  const statusLabel = statusLabels[agent.status]?.[language] || agent.status
  const isActive = agent.status !== 'idle'

  // Auth status display
  const authDisplay: Record<string, { label: string; color: string }> = {
    approved: { label: '✓', color: '#22c55e' },
    pending: { label: '⏳', color: '#eab308' },
    offline: { label: '✕', color: '#666' },
  }
  const auth = authDisplay[agent.authStatus] || authDisplay.offline

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        width: '100%',
        maxWidth: '420px',
        margin: '0 auto',
        background: '#0a0e1a',
        borderRadius: '8px',
        border: '2px solid #3B82F666',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), 0 0 60px rgba(59, 130, 246, 0.05), inset 0 0 40px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'monospace',
      }}
    >
      {/* Grid Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Pixel Corners */}
      <PixelCorner position="tl" color="#3B82F6" />
      <PixelCorner position="tr" color="#3B82F6" />
      <PixelCorner position="bl" color="#3B82F6" />
      <PixelCorner position="br" color="#3B82F6" />

      {/* All content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px 10px',
            borderBottom: '1px solid #1a2040',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#1a1e2e',
              border: '1px solid #2a3050',
              borderRadius: '4px',
              padding: '4px 10px',
              color: '#888',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '1px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#3B82F6' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a3050'; e.currentTarget.style.color = '#888' }}
          >
            <ChevronLeft size={12} />
            {t.back}
          </motion.button>

          <span style={{
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#e0e0e0',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
          }}>
            {agent.name}
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '3px',
            border: `1px solid ${statusColor}44`,
            background: `${statusColor}15`,
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 4px ${statusColor}`,
              animation: isActive ? 'dotPulse 1.5s ease-in-out infinite' : 'none',
            }} />
            <span style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              color: statusColor,
              fontWeight: 'bold',
            }}>
              {statusLabel}
            </span>
          </div>
        </motion.div>

        {/* ===== AVATAR PANEL ===== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 16px 16px',
            position: 'relative',
          }}
        >
          {/* Neon border panel behind avatar */}
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '12px',
            border: `2px solid ${statusColor}55`,
            background: '#0d1125',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: `0 0 15px ${statusColor}22, inset 0 0 15px ${statusColor}08`,
          }}>
            <StatusRing status={agent.status} size={110} />
            <motion.span
              key={agent.emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
              style={{ fontSize: '72px', lineHeight: 1, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))' }}
            >
              {agent.emoji}
            </motion.span>
          </div>

          {/* Role title */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            style={{
              marginTop: '10px',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#3B82F6',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
            }}
          >
            {profile?.role || agent.agentId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </motion.div>

          {/* Mini stats row under avatar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '8px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#555', letterSpacing: '1px', marginBottom: '2px' }}>{t.tasksCompleted}</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 'bold',
                color: statusColor,
                textShadow: `0 0 8px ${statusColor}44`,
              }}>
                {agent.tasksCompleted}
              </div>
            </div>

            <div style={{ width: '1px', height: '24px', background: '#1a2040' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#555', letterSpacing: '1px', marginBottom: '2px' }}>{t.authStatus}</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '14px',
                fontWeight: 'bold',
                color: auth.color,
              }}>
                {auth.label}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== CONTENT AREA (scrollable) ===== */}
        <div style={{
          padding: '0 16px 16px',
          maxHeight: 'calc(100vh - 380px)',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#3B82F644 #0a0e1a',
        }}>

          {/* Description */}
          {profile && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#666',
                textAlign: 'center',
                lineHeight: '1.5',
                marginBottom: '16px',
                padding: '0 8px',
              }}
            >
              {profile.description}
            </motion.p>
          )}

          {/* ===== STATS SECTION ===== */}
          <SectionHeader title={t.stats} delay={0.45} />
          {profile?.stats.map((stat, i) => (
            <StatBar
              key={stat.label}
              label={stat.label}
              value={stat.value}
              max={stat.max}
              color={stat.color}
              index={i}
            />
          ))}

          {/* ===== EQUIPMENT SECTION ===== */}
          {profile && (
            <>
              <div style={{ marginTop: '16px' }}>
                <SectionHeader title={t.equipment} delay={0.85} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  {profile.equipment.map((eq, i) => (
                    <EquipmentCard key={eq.name} equipment={eq} index={i} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ===== SKILLS SECTION ===== */}
          {profile && (
            <div style={{ marginTop: '16px' }}>
              <SectionHeader title={t.skills} delay={1.05} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.1 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
              >
                {profile.skills.map((skill, i) => {
                  const skillColors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981']
                  const borderColor = skillColors[i % skillColors.length]
                  return (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 1.15 + i * 0.05 }}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        color: '#ccc',
                        padding: '3px 10px',
                        border: `1px solid ${borderColor}66`,
                        borderRadius: '3px',
                        background: `${borderColor}11`,
                        letterSpacing: '0.3px',
                        cursor: 'default',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${borderColor}bb`
                        e.currentTarget.style.background = `${borderColor}22`
                        e.currentTarget.style.color = '#fff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${borderColor}66`
                        e.currentTarget.style.background = `${borderColor}11`
                        e.currentTarget.style.color = '#ccc'
                      }}
                    >
                      {skill}
                    </motion.span>
                  )
                })}
              </motion.div>
            </div>
          )}

          {/* ===== RECENT ACTIVITIES SECTION ===== */}
          {profile && (
            <div style={{ marginTop: '16px' }}>
              <SectionHeader title={t.recentActivities} delay={1.25} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {profile.recentActivities.map((activity, i) => (
                  <ActivityItem key={i} activity={activity} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.6 }}
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px 16px',
            borderTop: '1px solid #1a2040',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 16px rgba(59, 130, 246, 0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const nextStatus = agent.status === 'idle' ? 'executing' : 'idle'
              onSetAgentStatus(agent.agentId, nextStatus)
            }}
            style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              padding: '9px 12px',
              background: 'linear-gradient(135deg, #1e3a5f, #1a2e50)',
              color: '#3B82F6',
              border: '2px solid #3B82F655',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6aa'; e.currentTarget.style.background = 'linear-gradient(135deg, #234070, #1e3560)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3B82F655'; e.currentTarget.style.background = 'linear-gradient(135deg, #1e3a5f, #1a2e50)' }}
          >
            <Zap size={12} />
            {t.skillEnhancement}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 12px rgba(100, 100, 130, 0.2)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
            style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              padding: '9px 12px',
              background: '#161a2a',
              color: '#777',
              border: '2px solid #2a2e3e',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3a3e50'; e.currentTarget.style.color = '#999' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2e3e'; e.currentTarget.style.color = '#777' }}
          >
            <Clock size={12} />
            {t.viewMissionHistory}
          </motion.button>
        </motion.div>
      </div>

      {/* CSS keyframe for shimmer */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </motion.div>
  )
}
