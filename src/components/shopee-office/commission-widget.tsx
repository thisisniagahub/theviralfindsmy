'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import type { Language } from './language-toggle'

// ===== Types =====
interface CommissionWidgetProps {
  agents: Array<{
    agentId: string
    status: string
    tasksCompleted: number
  }>
  language: Language
}

// ===== Translations =====
const translations = {
  en: {
    totalEarnings: 'Total Earnings',
    todayEarnings: 'Today',
    pendingPayout: 'Pending Payout',
    commissionRate: 'Avg Rate',
    linksGenerated: 'Links',
    conversions: 'Conversions',
  },
  cn: {
    totalEarnings: '总收入',
    todayEarnings: '今日',
    pendingPayout: '待付款',
    commissionRate: '平均费率',
    linksGenerated: '链接',
    conversions: '转化',
  },
  jp: {
    totalEarnings: '総収入',
    todayEarnings: '本日',
    pendingPayout: '支払い待ち',
    commissionRate: '平均レート',
    linksGenerated: 'リンク',
    conversions: 'コンバージョン',
  },
}

// ===== Animated Counter =====
function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 2 }: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
}) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (latest) =>
    `${prefix}${latest.toFixed(decimals)}${suffix}`
  )
  const [displayText, setDisplayText] = useState(`${prefix}0.00${suffix}`)

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayText(v)
    })
    return unsubscribe
  }, [display])

  return <span>{displayText}</span>
}

// ===== Commission Data Generator =====
interface CommissionData {
  totalEarnings: number
  todayEarnings: number
  pendingPayout: number
  avgCommissionRate: number
  linksGenerated: number
  conversions: number
  recentCommissions: Array<{ amount: number; product: string; time: string }>
}

function generateCommissionData(agents: CommissionWidgetProps['agents'], prev?: CommissionData): CommissionData {
  const activeAgents = agents.filter((a) => a.status !== 'idle' && a.status !== 'error')
  const activityMultiplier = activeAgents.length / Math.max(agents.length, 1)

  // Increment based on activity
  const earningIncrement = activityMultiplier * (Math.random() * 15 + 2)
  const totalEarnings = (prev?.totalEarnings || 4230) + earningIncrement
  const todayEarnings = (prev?.todayEarnings || 312) + earningIncrement * 0.3
  const pendingPayout = (prev?.pendingPayout || 2450) + earningIncrement * 0.1

  const products = ['Wireless Earbuds', 'Face Mask Pack', 'Smart Watch', 'iPhone Case', 'Laneige Serum', 'Running Shoes', 'AirPods Pro', 'USB-C Hub']
  const newCommission = {
    amount: Math.random() * 30 + 3,
    product: products[Math.floor(Math.random() * products.length)],
    time: new Date().toLocaleTimeString(),
  }

  return {
    totalEarnings,
    todayEarnings,
    pendingPayout,
    avgCommissionRate: 4.8 + Math.random() * 0.4,
    linksGenerated: (prev?.linksGenerated || 1247) + (Math.random() > 0.7 ? 1 : 0),
    conversions: (prev?.conversions || 347) + (Math.random() > 0.8 ? 1 : 0),
    recentCommissions: [newCommission, ...(prev?.recentCommissions || []).slice(0, 4)],
  }
}

// ===== Component =====
export function CommissionWidget({ agents, language }: CommissionWidgetProps) {
  const [data, setData] = useState<CommissionData>(() => generateCommissionData(agents))
  const prevDataRef = useRef<CommissionData>(data)

  // Update commission data every 5 seconds based on agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateCommissionData(agents, prevDataRef.current))
    }, 5000)

    return () => clearInterval(interval)
  }, [agents])

  // Update ref when data changes
  useEffect(() => {
    prevDataRef.current = data
  }, [data])

  const t = translations[language]
  const activeAgents = agents.filter((a) => a.status !== 'idle' && a.status !== 'error')
  const efficiency = agents.length > 0 ? Math.round((activeAgents.length / agents.length) * 100) : 0

  return (
    <motion.div
      className="shopee-office-panel"
      style={{ flex: '0 0 320px', minWidth: 280 }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <div className="shopee-panel-title flex items-center gap-2">
        💰 Commission Tracker
        <motion.span
          className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold"
          style={{
            background: efficiency >= 70 ? 'rgba(34,197,94,0.15)' : efficiency >= 40 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
            color: efficiency >= 70 ? '#22c55e' : efficiency >= 40 ? '#eab308' : '#ef4444',
            border: `1px solid ${efficiency >= 70 ? 'rgba(34,197,94,0.3)' : efficiency >= 40 ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
          animate={efficiency >= 70 ? { scale: [1, 1.05, 1] } : undefined}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {efficiency}% ACTIVE
        </motion.span>
      </div>

      {/* Total Earnings - Hero Number */}
      <motion.div
        className="text-center py-3 mb-3 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(238,77,45,0.1) 0%, rgba(255,215,0,0.05) 100%)',
          border: '1px solid rgba(238,77,45,0.2)',
        }}
      >
        <div style={{ fontSize: 9, color: '#888', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 4 }}>
          {t.totalEarnings}
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: '#FFD700',
          textShadow: '0 0 12px rgba(255,215,0,0.3)',
        }}>
          RM <AnimatedCounter value={data.totalEarnings} />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="shopee-productivity-card">
          <div className="shopee-productivity-value" style={{ color: '#22c55e', fontSize: 16 }}>
            RM <AnimatedCounter value={data.todayEarnings} />
          </div>
          <div className="shopee-productivity-label">{t.todayEarnings}</div>
        </div>
        <div className="shopee-productivity-card">
          <div className="shopee-productivity-value" style={{ color: '#f97316', fontSize: 16 }}>
            RM <AnimatedCounter value={data.pendingPayout} />
          </div>
          <div className="shopee-productivity-label">{t.pendingPayout}</div>
        </div>
        <div className="shopee-productivity-card">
          <div className="shopee-productivity-value" style={{ color: '#06b6d4', fontSize: 16 }}>
            <AnimatedCounter value={data.avgCommissionRate} suffix="%" />
          </div>
          <div className="shopee-productivity-label">{t.commissionRate}</div>
        </div>
        <div className="shopee-productivity-card">
          <div className="shopee-productivity-value" style={{ color: '#4ECDC4', fontSize: 16 }}>
            {data.linksGenerated.toLocaleString()}
          </div>
          <div className="shopee-productivity-label">{t.linksGenerated}</div>
        </div>
      </div>

      {/* Recent Commissions */}
      <div style={{ borderTop: '1px solid #2a2d3e', paddingTop: 8 }}>
        <div style={{ fontSize: 9, color: '#666', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 }}>
          RECENT COMMISSIONS
        </div>
        <div className="space-y-1" style={{ maxHeight: 100, overflowY: 'auto' }}>
          {data.recentCommissions.map((comm, i) => (
            <motion.div
              key={`${comm.time}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="flex items-center justify-between px-2 py-1 rounded"
              style={{ background: i === 0 ? 'rgba(255,215,0,0.06)' : 'transparent' }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 10 }}>💰</span>
                <span style={{ fontSize: 9, color: '#aaa', fontFamily: 'monospace' }}>{comm.product}</span>
              </div>
              <span style={{
                fontSize: 10,
                color: '#FFD700',
                fontFamily: 'monospace',
                fontWeight: 'bold',
              }}>
                +RM {comm.amount.toFixed(2)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
