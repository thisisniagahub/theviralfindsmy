'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhaserGame, type AgentData } from '@/components/shopee-office'
import { ControlPanel } from '@/components/shopee-office/control-panel'
import { AgentsPanel, type AgentInfo } from '@/components/shopee-office/agents-panel'
import { MemoPanel, type MemoData } from '@/components/shopee-office/memo-panel'
import { AgentGrid, type AgentGridAgent } from '@/components/shopee-office/agent-grid'
import { AgentProfile, type ProfileAgent } from '@/components/shopee-office/agent-profile'
import { LanguageToggle, type Language } from '@/components/shopee-office/language-toggle'
import '@/components/shopee-office/shopee-office.css'

type AgentStatus = AgentData['status']
type ViewMode = 'office' | 'grid' | 'profile'

// ===== Helpers =====
function mapApiAgentToPhaser(apiAgent: AgentInfo): AgentData {
  return {
    id: apiAgent.agentId,
    name: apiAgent.name,
    emoji: apiAgent.emoji,
    status: apiAgent.status,
    detail: apiAgent.detail,
    zone: apiAgent.zone,
    updatedAt: apiAgent.updated_at,
    tasksCompleted: apiAgent.tasksCompleted,
  }
}

function mapApiAgentToGrid(apiAgent: AgentInfo): AgentGridAgent {
  return {
    agentId: apiAgent.agentId,
    name: apiAgent.name,
    emoji: apiAgent.emoji,
    status: apiAgent.status,
    detail: apiAgent.detail,
    tasksCompleted: apiAgent.tasksCompleted,
    authStatus: apiAgent.authStatus,
  }
}

function mapApiAgentToProfile(apiAgent: AgentInfo): ProfileAgent {
  return {
    agentId: apiAgent.agentId,
    name: apiAgent.name,
    emoji: apiAgent.emoji,
    status: apiAgent.status,
    detail: apiAgent.detail,
    tasksCompleted: apiAgent.tasksCompleted,
    authStatus: apiAgent.authStatus,
  }
}

// ===== View Tab Component =====
function ViewTab({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string
  icon: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      className="shopee-view-tab"
      data-active={isActive ? 'true' : undefined}
      onClick={onClick}
    >
      <span className="shopee-view-tab-icon">{icon}</span>
      <span>{label}</span>
      {isActive && <motion.div className="shopee-view-tab-indicator" layoutId="viewTabIndicator" />}
    </button>
  )
}

// ===== Component =====
export function AgentOfficePage() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [memo, setMemo] = useState<MemoData | null>(null)
  const [memoLoading, setMemoLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState<AgentStatus | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [language, setLanguage] = useState<Language>('en')
  const [showCoords, setShowCoords] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('office')
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ===== Fetch initial data =====
  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, memoRes] = await Promise.all([
          fetch('/api/shopee-office/agents'),
          fetch('/api/shopee-office/memo'),
        ])
        if (agentsRes.ok) {
          const data = await agentsRes.json()
          setAgents(data.agents || [])
        }
        if (memoRes.ok) {
          const data = await memoRes.json()
          setMemo(data.memo || null)
        }
      } catch (err) {
        console.error('Failed to fetch shopee-office data:', err)
      } finally {
        setMemoLoading(false)
      }
    }
    fetchData()
  }, [])

  // ===== Poll agents every 3 seconds =====
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      if (isPaused) return
      try {
        const res = await fetch('/api/shopee-office/agents')
        if (res.ok) {
          const data = await res.json()
          setAgents(data.agents || [])
        }
      } catch {
        // Silent fail for polling
      }
    }, 3000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [isPaused])

  // ===== Simulation: randomize one agent every 5-8s =====
  useEffect(() => {
    if (isPaused) return

    simulationRef.current = setInterval(async () => {
      if (agents.length === 0) return
      const randomAgent = agents[Math.floor(Math.random() * agents.length)]
      if (!randomAgent || randomAgent.authStatus === 'offline') return

      const statuses: AgentStatus[] = ['idle', 'writing', 'researching', 'executing', 'syncing', 'error']
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

      try {
        const res = await fetch(`/api/shopee-office/agents/${randomAgent.agentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: randomStatus }),
        })
        if (res.ok) {
          const data = await res.json()
          setAgents((prev) =>
            prev.map((a) =>
              a.agentId === data.agent.agentId ? { ...a, ...data.agent } : a
            )
          )
        }
      } catch {
        // Silent fail for simulation
      }
    }, 5000 + Math.random() * 3000)

    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current)
    }
  }, [isPaused, agents])

  // ===== Handlers =====
  const handleSetAllStatus = useCallback(async (status: AgentStatus) => {
    setActiveStatus(status)
    try {
      const res = await fetch('/api/shopee-office/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
      }
    } catch {
      console.error('Failed to set all agents status')
    }
  }, [])

  const handleSetAgentStatus = useCallback(async (agentId: string, status: AgentStatus) => {
    try {
      const res = await fetch(`/api/shopee-office/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setAgents((prev) =>
          prev.map((a) =>
            a.agentId === data.agent.agentId ? { ...a, ...data.agent } : a
          )
        )
      }
    } catch {
      console.error('Failed to set agent status')
    }
  }, [])

  const handleApproveAgent = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/shopee-office/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authStatus: 'approved' }),
      })
      if (res.ok) {
        const data = await res.json()
        setAgents((prev) =>
          prev.map((a) =>
            a.agentId === data.agent.agentId ? { ...a, ...data.agent } : a
          )
        )
      }
    } catch {
      console.error('Failed to approve agent')
    }
  }, [])

  const handleRejectAgent = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/shopee-office/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authStatus: 'offline' }),
      })
      if (res.ok) {
        const data = await res.json()
        setAgents((prev) =>
          prev.map((a) =>
            a.agentId === data.agent.agentId ? { ...a, ...data.agent } : a
          )
        )
      }
    } catch {
      console.error('Failed to reject agent')
    }
  }, [])

  // ===== Profile back handler =====
  const handleProfileBack = useCallback(() => {
    setSelectedAgentId(null)
    setViewMode('grid')
  }, [])

  // ===== Keyboard shortcuts =====
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const statusMap: Record<string, AgentStatus> = {
        '1': 'idle',
        '2': 'writing',
        '3': 'researching',
        '4': 'executing',
        '5': 'syncing',
        '6': 'error',
      }

      if (statusMap[e.key]) {
        e.preventDefault()
        handleSetAllStatus(statusMap[e.key])
      }

      if (e.key === ' ') {
        e.preventDefault()
        setIsPaused((prev) => !prev)
      }

      // Tab switching shortcuts
      if (e.key === 'q') setViewMode('office')
      if (e.key === 'w') setViewMode('grid')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSetAllStatus])

  // ===== Map agents to Phaser format =====
  const phaserAgents: AgentData[] = agents
    .filter((a) => a.authStatus !== 'offline')
    .map(mapApiAgentToPhaser)

  const gridAgents: AgentGridAgent[] = agents.map(mapApiAgentToGrid)
  const profileAgent: ProfileAgent | null = selectedAgentId
    ? mapApiAgentToProfile(agents.find((a) => a.agentId === selectedAgentId) || agents[0])
    : null

  // ===== Status text for overlay =====
  const activeAgents = agents.filter((a) => a.status !== 'idle' && a.status !== 'error')
  const errorAgents = agents.filter((a) => a.status === 'error')
  const onlineAgents = agents.filter((a) => a.authStatus !== 'offline')
  const totalTasksCompleted = agents.reduce((sum, a) => sum + a.tasksCompleted, 0)
  const avgTasks = agents.length > 0 ? Math.round(totalTasksCompleted / agents.length) : 0
  const productivityRate = onlineAgents.length > 0 ? Math.round((activeAgents.length / onlineAgents.length) * 100) : 0
  let statusText = `${activeAgents.length}/${onlineAgents.length} active`
  if (errorAgents.length > 0) {
    statusText += ` | ${errorAgents.length} error${errorAgents.length > 1 ? 's' : ''}`
  }
  if (isPaused) {
    statusText = `⏸ PAUSED — ${statusText}`
  }

  // ===== View Labels =====
  const viewLabels: Record<Language, Record<ViewMode, string>> = {
    en: { office: 'Office', grid: 'Agents', profile: 'Profile' },
    cn: { office: '办公室', grid: '代理', profile: '档案' },
    jp: { office: 'オフィス', grid: 'エージェント', profile: 'プロファイル' },
  }

  return (
    <div className="shopee-office-container">
      {/* ===== Header Bar ===== */}
      <motion.div
        className="flex items-center justify-between px-4 max-w-[1280px] mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-[#EE4D2D] font-mono tracking-wide">
            🛒 Shopee Office
          </span>
          <div className={`shopee-pause-indicator ${isPaused ? 'paused' : 'running'}`}>
            <span className="w-2 h-2 rounded-full" style={{
              background: isPaused ? '#eab308' : '#22c55e',
              animation: isPaused ? 'none' : 'dotPulse 1.5s ease-in-out infinite',
            }} />
            <span>{isPaused ? 'PAUSED' : 'LIVE'}</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-[#0d1020] border border-[#2a2d3e] rounded-md p-1">
          <ViewTab
            label={viewLabels[language].office}
            icon="🏢"
            isActive={viewMode === 'office'}
            onClick={() => setViewMode('office')}
          />
          <ViewTab
            label={viewLabels[language].grid}
            icon="👥"
            isActive={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          />
          {viewMode === 'profile' && (
            <ViewTab
              label={viewLabels[language].profile}
              icon="📊"
              isActive={viewMode === 'profile'}
              onClick={() => {}}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Quick stats in header */}
          <div className="hidden sm:flex items-center gap-4 mr-2">
            <span className="text-[10px] font-mono text-gray-400">
              Agents: <span className="text-white font-bold">{onlineAgents.length}</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Active: <span className="text-green-400 font-bold">{activeAgents.length}</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Errors: <span className={`font-bold ${errorAgents.length > 0 ? 'text-red-400' : 'text-gray-500'}`}>{errorAgents.length}</span>
            </span>
          </div>
          <LanguageToggle language={language} onLanguageChange={setLanguage} />
        </div>
      </motion.div>

      {/* ===== Animated Content ===== */}
      <AnimatePresence mode="wait">
        {/* ===== OFFICE VIEW ===== */}
        {viewMode === 'office' && (
          <motion.div
            key="office"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Game Canvas */}
            <motion.div
              className="shopee-office-game-wrapper"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="shopee-office-game-frame">
                <PhaserGame agents={phaserAgents} />
                <div className="shopee-office-scanlines" />
              </div>

              {/* Coordinates toggle (debug) */}
              <button
                className={`shopee-coords-btn ${showCoords ? 'shopee-coords-btn-active' : ''}`}
                onClick={() => setShowCoords(!showCoords)}
              >
                {showCoords ? '[x,y] ON' : '[x,y]'}
              </button>

              {/* Status overlay */}
              <div className="shopee-status-overlay">
                {statusText}
              </div>
            </motion.div>

            {/* ===== Productivity Stats Bar ===== */}
            <motion.div
              className="shopee-stats-bar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="shopee-stat-chip">
                <span>🤖</span>
                <span>Online:</span>
                <span className="shopee-stat-chip-value">{onlineAgents.length}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>⚡</span>
                <span>Active:</span>
                <span className="shopee-stat-chip-value" style={{ color: '#22c55e' }}>{activeAgents.length}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>✅</span>
                <span>Tasks:</span>
                <span className="shopee-stat-chip-value">{totalTasksCompleted}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>📊</span>
                <span>Avg:</span>
                <span className="shopee-stat-chip-value">{avgTasks}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>🔥</span>
                <span>Efficiency:</span>
                <span className="shopee-stat-chip-value" style={{ color: productivityRate >= 70 ? '#22c55e' : productivityRate >= 40 ? '#eab308' : '#ef4444' }}>{productivityRate}%</span>
              </div>
              {errorAgents.length > 0 && (
                <div className="shopee-stat-chip" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
                  <span>🐛</span>
                  <span>Errors:</span>
                  <span className="shopee-stat-chip-value" style={{ color: '#ef4444' }}>{errorAgents.length}</span>
                </div>
              )}
            </motion.div>

            {/* ===== Bottom Panels ===== */}
            <div className="shopee-office-panels">
              <ControlPanel
                activeStatus={activeStatus}
                isPaused={isPaused}
                onSetAllStatus={handleSetAllStatus}
                onTogglePause={() => setIsPaused(!isPaused)}
                language={language}
              />

              <AgentsPanel
                agents={agents}
                onSetAgentStatus={handleSetAgentStatus}
                onApproveAgent={handleApproveAgent}
                onRejectAgent={handleRejectAgent}
                language={language}
              />

              <MemoPanel
                memo={memo}
                isLoading={memoLoading}
                language={language}
              />
            </div>
          </motion.div>
        )}

        {/* ===== GRID VIEW (Agent Selection) ===== */}
        {viewMode === 'grid' && (
          <motion.div
            key="grid"
            className="max-w-[680px] mx-auto"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <AgentGrid
              agents={gridAgents}
              onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
              selectedAgentId={selectedAgentId}
              language={language}
            />

            {/* Mini stats bar below grid */}
            <motion.div
              className="shopee-stats-bar mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="shopee-stat-chip">
                <span>🤖</span>
                <span>Online:</span>
                <span className="shopee-stat-chip-value">{onlineAgents.length}/{agents.length}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>⚡</span>
                <span>Active:</span>
                <span className="shopee-stat-chip-value" style={{ color: '#22c55e' }}>{activeAgents.length}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>✅</span>
                <span>Total Tasks:</span>
                <span className="shopee-stat-chip-value">{totalTasksCompleted}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>🔥</span>
                <span>Efficiency:</span>
                <span className="shopee-stat-chip-value" style={{ color: productivityRate >= 70 ? '#22c55e' : productivityRate >= 40 ? '#eab308' : '#ef4444' }}>{productivityRate}%</span>
              </div>
            </motion.div>

            {/* Compact agents list below */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <AgentsPanel
                agents={agents}
                onSetAgentStatus={handleSetAgentStatus}
                onApproveAgent={handleApproveAgent}
                onRejectAgent={handleRejectAgent}
                language={language}
              />
            </motion.div>
          </motion.div>
        )}

        {/* ===== PROFILE VIEW ===== */}
        {viewMode === 'profile' && profileAgent && (
          <motion.div
            key="profile"
            className="max-w-[460px] mx-auto"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <AgentProfile
              agent={profileAgent}
              onBack={handleProfileBack}
              onSetAgentStatus={handleSetAgentStatus}
              language={language}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AgentOfficePage
