'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, Wifi, WifiOff, MessageSquare, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionData {
  id: string; agentId: string; status: 'active' | 'idle' | 'completed' | 'error';
  startedAt: string; lastActivity: string; messageCount: number; toolCalls: number;
}

interface SessionPanelProps {
  sessions: SessionData[]
  onViewSession: (sessionId: string) => void
  onTerminateSession: (sessionId: string) => void
}

const STATUS_CONFIG: Record<string, { icon: typeof Wifi; color: string; bg: string }> = {
  active: { icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  idle: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
  completed: { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  error: { icon: WifiOff, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' },
}

export function SessionPanel({ sessions, onViewSession, onTerminateSession }: SessionPanelProps) {
  const activeCount = sessions.filter(s => s.status === 'active').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">{activeCount} active sessions</span>
        </div>
      </div>

      <div className="space-y-2">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No active sessions
            </CardContent>
          </Card>
        ) : (
          sessions.map(session => {
            const config = STATUS_CONFIG[session.status]
            const StatusIcon = config.icon

            return (
              <Card key={session.id} className={cn(
                'border-border/50',
                session.status === 'active' && 'border-emerald-500/30'
              )}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn('w-3 h-3', config.color)} />
                        <span className="text-sm font-medium truncate">{session.agentId}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{session.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Started: {session.startedAt}</span>
                        <span>Messages: {session.messageCount}</span>
                        <span>Tools: {session.toolCalls}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onViewSession(session.id)}>
                        View
                      </Button>
                      {session.status === 'active' && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => onTerminateSession(session.id)}>
                          <WifiOff className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
