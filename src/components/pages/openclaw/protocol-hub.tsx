'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Server, Network, Radio, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProtocolStatus {
  mcpOnline: boolean
  mcpStatus: Record<string, unknown> | null
  a2aOnline: boolean
  a2aStatus: Record<string, unknown> | null
  mcpToolsCount: number
  a2aAgentsCount: number
}

interface ProtocolHubProps {
  status: ProtocolStatus
}

export function ProtocolHub({ status }: ProtocolHubProps) {
  const { mcpOnline, mcpStatus, a2aOnline, a2aStatus, mcpToolsCount, a2aAgentsCount } = status
  const mcpTools = mcpStatus?.tools as Record<string, unknown> | undefined
  const mcpPlugins = mcpStatus?.plugins as Record<string, unknown> | undefined
  const mcpServer = mcpStatus?.server as Record<string, unknown> | undefined

  const getNumber = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback
  const getText = (value: unknown, fallback = '---') => typeof value === 'string' || typeof value === 'number' ? String(value) : fallback

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MCP Protocol */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className={cn('glass-card h-full', mcpOnline ? 'border-emerald-500/30' : 'border-red-500/30')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-500" />
                  MCP Protocol
                </CardTitle>
                <span className={cn('w-2.5 h-2.5 rounded-full', mcpOnline ? 'bg-emerald-500 badge-pulse' : 'bg-red-500')} />
              </div>
              <CardDescription className="text-[10px]">Model Context Protocol v2024-11-05</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mcpOnline && mcpStatus ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Tools', value: getNumber(mcpTools?.total) },
                      { label: 'Active', value: getNumber(mcpTools?.active) },
                      { label: 'Plugins', value: getNumber(mcpPlugins?.total) },
                      { label: 'Executions', value: getNumber(mcpTools?.totalExecutions) },
                    ].map(s => (
                      <div key={s.label} className="p-2 rounded-lg bg-muted/20 text-center">
                        <p className="text-lg font-bold text-foreground">{String(s.value)}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-1">
                    <p>Uptime: {getText(mcpServer?.uptimeFormatted)}</p>
                    <p>Memory: {getText(mcpServer?.memoryUsage)}</p>
                    <p>WS Clients: {getNumber(mcpServer?.currentClients)}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <WifiOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">MCP Server offline</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* A2A Protocol */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={cn('glass-card h-full', a2aOnline ? 'border-blue-500/30' : 'border-red-500/30')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Network className="w-4 h-4 text-blue-500" />
                  A2A Protocol
                </CardTitle>
                <span className={cn('w-2.5 h-2.5 rounded-full', a2aOnline ? 'bg-blue-500 badge-pulse' : 'bg-red-500')} />
              </div>
              <CardDescription className="text-[10px]">Agent-to-Agent Protocol v1.0</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {a2aOnline && a2aStatus ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Agents', value: getNumber(a2aStatus?.agentCount) },
                      { label: 'Online', value: getNumber(a2aStatus?.onlineAgents) },
                      { label: 'Conversations', value: getNumber(a2aStatus?.activeConversations) },
                      { label: 'Messages', value: getNumber(a2aStatus?.totalMessagesProcessed) },
                    ].map(s => (
                      <div key={s.label} className="p-2 rounded-lg bg-muted/20 text-center">
                        <p className="text-lg font-bold text-foreground">{String(s.value)}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-1">
                    <p>Uptime: {getText(a2aStatus?.uptime)}</p>
                    <p>Protocol: {getText(a2aStatus?.protocol, 'A2A/1.0')}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <WifiOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">A2A Service offline</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ACP Protocol */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card border-purple-500/30 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-500" />
                  ACP Protocol
                </CardTitle>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 badge-pulse" />
              </div>
              <CardDescription className="text-[10px]">Agent Communication Protocol</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Status', value: 'Active' },
                  { label: 'Clients', value: '1' },
                  { label: 'Messages', value: mcpToolsCount },
                  { label: 'Agents', value: a2aAgentsCount },
                ].map(s => (
                  <div key={s.label} className="p-2 rounded-lg bg-muted/20 text-center">
                    <p className="text-lg font-bold text-foreground">{String(s.value)}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground space-y-1">
                <p>Connection: Local Bridge</p>
                <p>Format: JSON-RPC 2.0</p>
                <p>Security: Token-based</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Protocol Info */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <h4 className="font-semibold text-emerald-500 mb-1">MCP - Model Context Protocol</h4>
              <p className="text-muted-foreground">Connects AI models to external tools and data sources via OpenClaw Gateway. Provides structured tool definitions, input validation, and JSON-RPC execution. 11 tools registered across 5 categories.</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-500 mb-1">A2A - Agent-to-Agent Protocol</h4>
              <p className="text-muted-foreground">Enables multi-agent communication and orchestration. Agents discover each other, exchange messages, and coordinate tasks through a standardized protocol.</p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-500 mb-1">ACP - Agent Communication Protocol</h4>
              <p className="text-muted-foreground">Bridges AI agents with client applications. Manages the communication layer between the frontend interface and the backend AI services.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
