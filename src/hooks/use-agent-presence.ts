'use client'

import { useEffect, useState } from 'react'
import { getGatewayWS } from '@/lib/openclaw/ws-client'
import type { AgentData } from '@/components/shopee-office/game/scenes/OfficeScene'

export function useAgentPresence(initialAgents: AgentData[]) {
  const [agents, setAgents] = useState<AgentData[]>(initialAgents)

  useEffect(() => {
    const ws = getGatewayWS()

    const handlePresence = (payload: any) => {
      if (!payload || !Array.isArray(payload.agents)) return

      setAgents(prev => {
        return prev.map(agent => {
          // Find if this agent is in the presence payload
          const remoteAgent = payload.agents.find((a: any) => a.id === agent.id || a.agentId === agent.id)
          
          if (remoteAgent) {
            return {
              ...agent,
              status: mapRemoteStatus(remoteAgent.status || remoteAgent.activity),
              detail: remoteAgent.detail || remoteAgent.message || agent.detail,
              updatedAt: new Date().toISOString()
            }
          }
          return agent
        })
      })
    }

    // Subscribe to presence events
    const unsubscribe = ws.onEvent('presence', handlePresence)
    
    // Initial fetch
    void ws.getPresence().then(handlePresence)

    return () => {
      unsubscribe()
    }
  }, [])

  return agents
}

function mapRemoteStatus(status: string): AgentData['status'] {
  const s = String(status).toLowerCase()
  if (s.includes('write')) return 'writing'
  if (s.includes('research')) return 'researching'
  if (s.includes('execut')) return 'executing'
  if (s.includes('sync')) return 'syncing'
  if (s.includes('error') || s.includes('fail')) return 'error'
  if (s.includes('think')) return 'thinking'
  if (s.includes('collab')) return 'collaborating'
  if (s.includes('report')) return 'reporting'
  if (s.includes('break') || s.includes('sleep')) return 'break'
  return 'idle'
}
