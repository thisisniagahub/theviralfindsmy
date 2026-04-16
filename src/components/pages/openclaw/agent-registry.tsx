'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Bot, Send, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface A2AAgent {
  id: string; name: string; description: string; capabilities: string[];
  status: string; category: string; tasksCompleted: number; version: string;
}

interface AgentRegistryProps {
  agents: A2AAgent[]
  onMessageAgent: (agentId: string) => void
  onToggleAgent: (agentId: string) => void
  activeAgents: string[]
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  active: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  idle: { icon: Bot, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  error: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' },
}

export function AgentRegistry({ agents, onMessageAgent, onToggleAgent, activeAgents }: AgentRegistryProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {agents.map((agent) => {
          const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle
          const StatusIcon = statusConfig.icon
          const isActive = activeAgents.includes(agent.id)

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn(
                'border-border/50 transition-colors',
                isActive && 'border-blue-500/50 shadow-blue-500/10 shadow-md'
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-500" />
                      {agent.name.replace(/-/g, ' ')}
                    </CardTitle>
                    <StatusIcon className={cn('w-4 h-4', statusConfig.color)} />
                  </div>
                  <CardDescription className="text-xs">{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map(cap => (
                        <Badge key={cap} variant="outline" className="text-[10px]">{cap}</Badge>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">+{agent.capabilities.length - 3}</Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Tasks: {agent.tasksCompleted}</span>
                      <span>v{agent.version}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => onToggleAgent(agent.id)}>
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" className="flex-1 text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onMessageAgent(agent.id)}>
                        <Send className="w-3 h-3 mr-1" /> Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
