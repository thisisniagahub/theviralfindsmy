'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Plus, Play, Pause, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface CronJob {
  id: string; name: string; schedule: string; tool: string; enabled: boolean; lastRun: string | null; nextRun: string | null;
}

interface CronPanelProps {
  jobs: CronJob[]
  onAddJob: (job: { name: string; schedule: string; tool: string }) => void
  onToggleJob: (id: string) => void
  onDeleteJob: (id: string) => void
  onRunJob: (id: string) => void
}

export function CronPanel({ jobs, onAddJob, onToggleJob, onDeleteJob, onRunJob }: CronPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newJob, setNewJob] = useState({ name: '', schedule: '', tool: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newJob.name.trim() || !newJob.schedule.trim() || !newJob.tool.trim()) {
      toast.error('Please fill all fields')
      return
    }
    onAddJob(newJob)
    setNewJob({ name: '', schedule: '', tool: '' })
    setShowAddForm(false)
    toast.success('Cron job added')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Scheduled tasks that run automatically</p>
        <Button size="sm" className="text-xs gap-1" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-3 h-3" /> Add Job
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-3 p-4">
            <Input placeholder="Job name" value={newJob.name} onChange={e => setNewJob(prev => ({ ...prev, name: e.target.value }))} />
            <Input placeholder="Cron schedule (e.g., 0 */6 * * *)" value={newJob.schedule} onChange={e => setNewJob(prev => ({ ...prev, schedule: e.target.value }))} />
            <Input placeholder="Tool to execute" value={newJob.tool} onChange={e => setNewJob(prev => ({ ...prev, tool: e.target.value }))} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 text-xs" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 text-xs">Create Job</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No scheduled jobs yet
            </CardContent>
          </Card>
        ) : (
          jobs.map(job => (
            <Card key={job.id} className="border-border/50">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{job.name}</span>
                      <Badge variant={job.enabled ? 'default' : 'secondary'} className="text-[10px]">
                        {job.enabled ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <code className="text-[10px] bg-muted px-1 rounded">{job.schedule}</code>
                      <span>Tool: {job.tool}</span>
                      {job.lastRun && <span>Last: {job.lastRun}</span>}
                      {job.nextRun && <span>Next: {job.nextRun}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onRunJob(job.id)}>
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onToggleJob(job.id)}>
                      {job.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => onDeleteJob(job.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
