'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Server, Wifi, WifiOff, RefreshCw, Database, Bot, Bell } from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'checking'
  latencyMs?: number
  icon: React.ElementType
  detail?: string
}

export function VPSHealthWidget() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'OpenClaw Gateway', status: 'checking', icon: Bot },
    { name: 'PostgreSQL (VPS)', status: 'checking', icon: Database },
    { name: 'Notification Service', status: 'checking', icon: Bell },
    { name: 'NiagaBot Pipeline', status: 'checking', icon: Activity },
  ])
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkHealth = useCallback(async () => {
    setIsChecking(true)
    try {
      const res = await fetch('/api/health')
      const data = await res.json()

      setServices([
        {
          name: 'OpenClaw Gateway',
          status: data.services?.openclaw || 'unhealthy',
          latencyMs: data.services?.openclawLatencyMs,
          icon: Bot,
          detail: data.services?.openclawDetail || 'operator.gangniaga.my',
        },
        {
          name: 'PostgreSQL (VPS)',
          status: data.services?.database || 'unhealthy',
          latencyMs: data.services?.databaseLatencyMs,
          icon: Database,
          detail: '76.13.176.142:5432',
        },
        {
          name: 'Notification Service',
          status: data.services?.notification || 'unhealthy',
          icon: Bell,
          detail: 'WebSocket :3004',
        },
        {
          name: 'NiagaBot Pipeline',
          status: data.services?.openclaw === 'healthy' ? 'healthy' : 'unhealthy',
          icon: Activity,
          detail: 'A2A Chained Pipeline',
        },
      ])
      setLastChecked(new Date())
    } catch {
      setServices(prev => prev.map(s => ({ ...s, status: 'unhealthy' as const })))
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 60_000)
    return () => clearInterval(interval)
  }, [checkHealth])

  const statusColor = (s: string) => {
    switch (s) {
      case 'healthy': return '#22c55e'
      case 'degraded': return '#f59e0b'
      case 'unhealthy': return '#ef4444'
      default: return '#888'
    }
  }

  const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy'
    : services.some(s => s.status === 'healthy') ? 'degraded' : 'unhealthy'

  return (
    <div className="card-elevated p-4 rounded-xl bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">VPS Status</span>
          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusColor(overallStatus) }} />
        </div>
        <button onClick={checkHealth} disabled={isChecking} className="p-1 rounded hover:bg-muted transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="space-y-2">
        {services.map((svc) => {
          const Icon = svc.icon
          return (
            <div key={svc.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" style={{ color: statusColor(svc.status) }} />
                <span className="text-foreground">{svc.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {svc.latencyMs !== undefined && (
                  <span className="text-muted-foreground">{svc.latencyMs}ms</span>
                )}
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: statusColor(svc.status) }} />
              </div>
            </div>
          )
        })}
      </div>
      {lastChecked && (
        <div className="text-[10px] text-muted-foreground mt-2 text-right">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
