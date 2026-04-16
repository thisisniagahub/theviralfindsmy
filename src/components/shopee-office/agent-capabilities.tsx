'use client'

import { motion } from 'framer-motion'
import type { Language } from './language-toggle'

const AGENT_CAPABILITIES: Record<string, {
  stats: { label: string; value: number; max: number; color: string }[]
  equipment: { name: string; icon: string; description: string }[]
  skills: string[]
}> = {
  'product-scout': {
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
  },
  'link-builder': {
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
  },
  'campaign-master': {
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
  },
  'analytics-agent': {
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
  },
  'content-writer': {
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
  },
  'payout-checker': {
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
  },
  'seo-optimizer': {
    stats: [
      { label: 'SEO Score', value: 91, max: 100, color: '#22c55e' },
      { label: 'Keywords Tracked', value: 2341, max: 3000, color: '#06b6d4' },
      { label: 'Optimizations', value: 456, max: 600, color: '#f97316' },
    ],
    equipment: [
      { name: 'SEO Analyzer', icon: '🔎', description: 'On-page SEO analysis' },
      { name: 'Rank Tracker', icon: '📈', description: 'Keyword position tracking' },
    ],
    skills: ['Title Optimization', 'Keyword Research', 'SERP Analysis'],
  },
  'review-monitor': {
    stats: [
      { label: 'Reviews Scanned', value: 8934, max: 10000, color: '#22c55e' },
      { label: 'Sentiment Accuracy', value: 87, max: 100, color: '#06b6d4' },
      { label: 'Alerts Sent', value: 123, max: 200, color: '#f97316' },
    ],
    equipment: [
      { name: 'Sentiment Engine', icon: '💭', description: 'NLP sentiment analysis' },
      { name: 'Alert System', icon: '🚨', description: 'Real-time review alerts' },
    ],
    skills: ['Sentiment Analysis', 'Review Monitoring', 'Trend Detection'],
  },
}

function StatBar({ label, value, max, color, index }: { label: string; value: number; max: number; color: string; index: number }) {
  const percentage = Math.min(100, (value / max) * 100)
  const displayValue = max <= 100 ? `${value}%` : `${value.toLocaleString()}/${max.toLocaleString()}`

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
      style={{ marginBottom: '10px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#999', letterSpacing: '0.5px' }}>{label.toUpperCase()}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color, fontWeight: 'bold' }}>{displayValue}</span>
      </div>
      <div style={{ height: '6px', background: '#0a0e1a', borderRadius: '3px', overflow: 'hidden', border: '1px solid #1a2040' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${color}cc, ${color})`, boxShadow: `0 0 8px ${color}66` }}
        />
      </div>
    </motion.div>
  )
}

function EquipmentCard({ equipment, index }: { equipment: { name: string; icon: string; description: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
      style={{ flex: 1, minWidth: 0, background: '#12162a', border: '2px solid #7c3aed44', borderRadius: '6px', padding: '10px 12px', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)' }} />
      <div style={{ fontSize: '24px', marginBottom: '6px' }}>{equipment.icon}</div>
      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e0e0e0', fontWeight: 'bold', marginBottom: '2px' }}>{equipment.name}</div>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#777', lineHeight: '1.4' }}>{equipment.description}</div>
    </motion.div>
  )
}

function SkillTag({ skill, index }: { skill: string; index: number }) {
  const borderColor = '#3B82F6'
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: 1.1 + index * 0.05 }}
      whileHover={{ scale: 1.05, borderColor: `${borderColor}bb`, background: `${borderColor}22` }}
      style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: '10px', color: '#ccc', padding: '3px 10px', border: `1px solid ${borderColor}66`, borderRadius: '3px', background: `${borderColor}11`, letterSpacing: '0.3px', cursor: 'default' }}
    >
      {skill}
    </motion.span>
  )
}

interface AgentCapabilitiesProps {
  agentId: string
  language: Language
}

export function AgentCapabilities({ agentId, language: _language }: AgentCapabilitiesProps) {
  const profile = AGENT_CAPABILITIES[agentId]
  if (!profile) return null

  const t = { stats: 'STATISTICS', equipment: 'EQUIPMENT', skills: 'SKILLS' }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Stats */}
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3B82F6', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '1px', background: '#3B82F6' }} />
          {t.stats}
        </div>
        {profile.stats.map((stat, i) => (
          <StatBar key={stat.label} label={stat.label} value={stat.value} max={stat.max} color={stat.color} index={i} />
        ))}
      </div>

      {/* Equipment */}
      <div style={{ marginTop: '14px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#7c3aed', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '1px', background: '#7c3aed' }} />
          {t.equipment}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {profile.equipment.map((eq, i) => (
            <EquipmentCard key={eq.name} equipment={eq} index={i} />
          ))}
        </div>
      </div>

      {/* Skills */}
      <div style={{ marginTop: '14px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#06b6d4', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '1px', background: '#06b6d4' }} />
          {t.skills}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {profile.skills.map((skill, i) => (
            <SkillTag key={skill} skill={skill} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
