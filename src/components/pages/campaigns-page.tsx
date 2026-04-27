'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
// Select components removed (unused)
import { Plus, Link2, Eye, TrendingUp, DollarSign, Calendar, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CampaignData {
  id: string; name: string; description: string | null; status: string
  budget: number | null; spent: number; startDate: string | null; endDate: string | null
  totalClicks: number; totalConversions: number; totalEarnings: number; linkCount: number
  createdAt: string
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

export function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', budget: '', startDate: '', endDate: '' })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: campaigns, isLoading } = useQuery<CampaignData[]>({
    queryKey: ['campaigns'],
    queryFn: () => fetch('/api/campaigns').then((r) => r.json()),
  })

  const filtered = campaigns?.filter((c) => statusFilter === 'all' || c.status === statusFilter)

  const createMutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaigns'] }); toast({ title: 'Campaign created!' }); setShowCreate(false); setFormData({ name: '', description: '', budget: '', startDate: '', endDate: '' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/campaigns/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaigns'] }); toast({ title: 'Campaign deleted' }) },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Manage your marketing campaigns</p>
        </div>
        <Button className="bg-shopee hover:bg-shopee-dark text-white" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Campaign
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({campaigns?.length || 0})</TabsTrigger>
          <TabsTrigger value="active">Active ({campaigns?.filter(c => c.status === 'active').length || 0})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({campaigns?.filter(c => c.status === 'paused').length || 0})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({campaigns?.filter(c => c.status === 'completed').length || 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Campaign Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((campaign) => {
            const budgetPct = campaign.budget ? Math.min((campaign.spent / campaign.budget) * 100, 100) : 0
            const roi = campaign.spent > 0 ? (((campaign.totalEarnings - campaign.spent) / campaign.spent) * 100).toFixed(0) : '0'

            return (
              <Card key={campaign.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 card-hover-ripple">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold truncate">{campaign.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.description || 'No description'}</p>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ml-2 flex-shrink-0 ${statusColors[campaign.status] || ''}`}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <Link2 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-bold">{campaign.linkCount}</p>
                      <p className="text-[10px] text-muted-foreground">Links</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <Eye className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-bold">{campaign.totalClicks.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Clicks</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <DollarSign className="w-4 h-4 mx-auto text-shopee mb-1" />
                      <p className="text-sm font-bold text-shopee">RM {campaign.totalEarnings.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">Revenue</p>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  {campaign.budget && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Budget Usage</span>
                        <span className="font-medium">RM {campaign.spent.toFixed(0)} / RM {campaign.budget.toFixed(0)}</span>
                      </div>
                      <Progress value={budgetPct} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {budgetPct >= 90 ? <span className="text-red-500">Almost exhausted</span> : <span>{budgetPct.toFixed(0)}% used</span>}
                      </p>
                    </div>
                  )}

                  {/* ROI & Date */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-green-600 font-medium">ROI: {roi}%</span>
                    </div>
                    {campaign.endDate && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(campaign.endDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      <Eye className="w-3 h-3 mr-1" /> View Details
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(campaign.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filtered?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p className="text-sm">No campaigns found for this filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>Set up a new marketing campaign</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Campaign Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Summer Sale 2025" /></div>
            <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the campaign" /></div>
            <div><Label>Budget (RM)</Label><Input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="5000" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-shopee hover:bg-shopee-dark text-white" onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
