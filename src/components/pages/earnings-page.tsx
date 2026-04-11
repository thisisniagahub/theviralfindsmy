'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, Clock, ArrowUpFromLine, Wallet, CreditCard,
  Target, Plus, Edit3, Trash2, TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface Payout {
  id: string; method: string; amount: number; status: string
  bankName: string | null; accountNo: string | null; accountName: string | null
  requestedAt: string; processedAt: string | null; note: string | null
}

interface EarningsResponse {
  payouts: Payout[]
  summary: { totalEarned: number; pendingAmount: number; availableAmount: number; withdrawnAmount: number }
  monthlyEarnings: { month: string; earnings: number }[]
}

interface EarningGoal {
  id: string; name: string; targetAmount: number; currentAmount: number
  period: string; startDate: string; endDate: string | null; status: string
  createdAt: string; updatedAt: string
}

interface GoalsResponse {
  goals: EarningGoal[]
  summary: { totalGoals: number; activeGoals: number; achievedGoals: number; totalTarget: number; totalCurrent: number; overallProgress: number }
}

const payoutStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  ewallet: 'E-Wallet',
}

const periodBadgeColor: Record<string, string> = {
  monthly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  weekly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  yearly: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  custom: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
}

function formatRM(amount: number) {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
}

// Circular progress ring component
function GoalProgressRing({ percentage, size = 120, strokeWidth = 8, color }: {
  percentage: number; size?: number; strokeWidth?: number; color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Math.round(percentage)}%
        </motion.span>
        <span className="text-[10px] text-muted-foreground">progress</span>
      </div>
    </div>
  )
}

export function EarningsPage() {
  const [showPayout, setShowPayout] = useState(false)
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'bank_transfer', bankName: '', accountNo: '', accountName: '', note: '' })
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [editingGoal, setEditingGoal] = useState<EarningGoal | null>(null)
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null)
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '', period: 'monthly', startDate: '', endDate: '' })
  const [updateAmount, setUpdateAmount] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<EarningsResponse>({
    queryKey: ['earnings'],
    queryFn: () => fetch('/api/payouts').then((r) => r.json()),
  })

  const { data: goalsData } = useQuery<GoalsResponse>({
    queryKey: ['goals'],
    queryFn: () => fetch('/api/goals').then((r) => r.json()),
  })

  const requestMutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      fetch('/api/payouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
      toast({ title: 'Payout requested!', description: 'Your payout is being processed.' })
      setShowPayout(false)
      setPayoutForm({ amount: '', method: 'bank_transfer', bankName: '', accountNo: '', accountName: '', note: '' })
    },
  })

  const createGoalMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({ title: 'Goal created!', description: 'Your new earning goal has been set.' })
      setShowGoalDialog(false)
      resetGoalForm()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create goal. Please check your inputs.', variant: 'destructive' })
    },
  })

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      fetch(`/api/goals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({ title: 'Goal updated!', description: 'Your goal has been updated.' })
      setEditingGoal(null)
      setShowGoalDialog(false)
      resetGoalForm()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update goal.', variant: 'destructive' })
    },
  })

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/goals/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({ title: 'Goal deleted', description: 'The goal has been removed.' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete goal.', variant: 'destructive' })
    },
  })

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      fetch(`/api/goals/${id}/update-progress`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }) }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      const newStatus = data?.status === 'achieved' ? 'Goal achieved! Congratulations!' : 'Progress updated successfully!'
      toast({ title: 'Progress updated!', description: newStatus })
      setShowUpdateDialog(false)
      setUpdatingGoalId(null)
      setUpdateAmount('')
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update progress.', variant: 'destructive' })
    },
  })

  const resetGoalForm = () => {
    setGoalForm({ name: '', targetAmount: '', period: 'monthly', startDate: '', endDate: '' })
    setEditingGoal(null)
  }

  const handleSaveGoal = () => {
    if (!goalForm.name.trim() || !goalForm.targetAmount || Number(goalForm.targetAmount) <= 0) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' })
      return
    }
    const body: Record<string, unknown> = {
      name: goalForm.name.trim(),
      targetAmount: Number(goalForm.targetAmount),
      period: goalForm.period,
    }
    if (goalForm.period === 'custom') {
      if (goalForm.startDate) body.startDate = goalForm.startDate
      if (goalForm.endDate) body.endDate = goalForm.endDate
    }
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, body })
    } else {
      createGoalMutation.mutate(body)
    }
  }

  const handleEditGoal = (goal: EarningGoal) => {
    setEditingGoal(goal)
    setGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      period: goal.period,
      startDate: goal.startDate ? goal.startDate.split('T')[0] : '',
      endDate: goal.endDate ? goal.endDate.split('T')[0] : '',
    })
    setShowGoalDialog(true)
  }

  const summaryCards = [
    {
      label: 'Total Earned',
      value: `RM ${data?.summary?.totalEarned.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-shopee bg-shopee/10',
    },
    {
      label: 'Available',
      value: `RM ${data?.summary?.availableAmount.toFixed(2) || '0.00'}`,
      icon: Wallet,
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Pending',
      value: `RM ${data?.summary?.pendingAmount.toFixed(2) || '0.00'}`,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Withdrawn',
      value: `RM ${data?.summary?.withdrawnAmount.toFixed(2) || '0.00'}`,
      icon: CreditCard,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  const pendingPayouts = data?.payouts?.filter((p) => p.status === 'pending' || p.status === 'processing') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Earnings & Payouts</h2>
          <p className="text-sm text-muted-foreground">Track your earnings and manage payouts</p>
        </div>
        <Button className="btn-shopee" onClick={() => setShowPayout(true)}>
          <ArrowUpFromLine className="w-4 h-4 mr-2" /> Request Payout
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="card-elevated border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className={`p-2.5 rounded-lg w-fit ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold mt-3">{card.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ========== EARNINGS GOALS SECTION ========== */}
      <Card className="glass-card border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-shopee" />
                Earnings Goals
              </CardTitle>
              {goalsData?.summary && (
                <p className="text-sm text-muted-foreground mt-1">
                  {goalsData.summary.activeGoals} active · {goalsData.summary.achievedGoals} achieved · Overall: {goalsData.summary.overallProgress}%
                </p>
              )}
            </div>
            <Button
              size="sm"
              className="btn-shopee text-xs h-8"
              onClick={() => { resetGoalForm(); setShowGoalDialog(true) }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Create Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {(!goalsData?.goals || goalsData.goals.length === 0) ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No goals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first earning goal to start tracking progress</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 text-xs"
                onClick={() => { resetGoalForm(); setShowGoalDialog(true) }}
              >
                <Plus className="w-3 h-3 mr-1" /> Create Goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goalsData.goals.map((goal, index) => {
                const pct = goal.targetAmount > 0
                  ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                  : 0
                const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
                const ringColor = pct >= 80 ? '#22C55E' : pct >= 50 ? '#EE4D2D' : '#EF4444'
                const daysLeft = goal.endDate
                  ? Math.max(Math.ceil((new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0)
                  : null
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                  >
                    <Card className="border-border/50 shadow-sm card-elevated h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Circular Progress Ring */}
                          <div className="flex-shrink-0">
                            <GoalProgressRing percentage={pct} size={100} strokeWidth={8} color={ringColor} />
                          </div>
                          {/* Goal Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold truncate">{goal.name}</h3>
                              {goal.status === 'achieved' && <span>✨</span>}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${periodBadgeColor[goal.period] || ''}`}>
                                {goal.period}
                              </Badge>
                              {goal.status === 'achieved' && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Achieved!
                                </Badge>
                              )}
                              {goal.status === 'expired' && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400">
                                  Expired
                                </Badge>
                              )}
                            </div>
                            <p className="text-lg font-bold metric-money">
                              {formatRM(goal.currentAmount)} <span className="text-sm font-normal text-muted-foreground">/ {formatRM(goal.targetAmount)}</span>
                            </p>
                            {goal.status !== 'achieved' && remaining > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <TrendingUp className="w-3 h-3 inline mr-1" />
                                RM {remaining.toFixed(2)} remaining
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {goal.startDate && (
                                <span>{new Date(goal.startDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</span>
                              )}
                              {goal.endDate && (
                                <>
                                  <span>→</span>
                                  <span>{new Date(goal.endDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </>
                              )}
                              {daysLeft !== null && goal.status === 'active' && (
                                <span className="text-shopee font-medium">{daysLeft}d left</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
                          {goal.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 flex-1 hover:border-shopee/30 hover:text-shopee"
                              onClick={() => { setUpdatingGoalId(goal.id); setUpdateAmount(''); setShowUpdateDialog(true) }}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" /> Update Progress
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 hover:border-blue-30 hover:text-blue-600"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <Edit3 className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 hover:border-red-30 hover:text-red-600"
                            onClick={() => deleteGoalMutation.mutate(goal.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Earnings Chart */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Monthly Earnings</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyEarnings || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `RM${v}`} />
                <Tooltip formatter={(value: number) => [`RM ${value.toFixed(2)}`, 'Earnings']} />
                <Bar dataKey="earnings" fill="#EE4D2D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Earnings Breakdown</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { source: 'Direct Links', amount: 2450, pct: 45, color: 'bg-shopee' },
              { source: 'Campaign Links', amount: 1890, pct: 35, color: 'bg-blue-500' },
              { source: 'Social Media', amount: 1080, pct: 20, color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.source} className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.source}</span>
                  <span className="text-sm font-bold">RM {item.amount.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{item.pct}% of total earnings</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Payouts */}
      {pendingPayouts.length > 0 && (
        <Card className="border-shopee/30 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-shopee">Pending & Processing Payouts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Method</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Bank / Wallet</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Account</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayouts.map((p, idx) => {
                  return (
                    <TableRow key={p.id} className={idx % 2 === 1 ? 'even:bg-muted/30' : ''}>
                      <TableCell className="text-[13px] font-medium">{methodLabels[p.method] || p.method}</TableCell>
                      <TableCell className="text-[13px] font-medium">{p.bankName || '-'}</TableCell>
                      <TableCell className="text-[13px] font-mono font-medium">{p.accountNo || '-'}</TableCell>
                      <TableCell className="text-right text-[13px] font-bold metric-money">RM {p.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${payoutStatusColors[p.status] || ''}`}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.requestedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Payout History</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">ID</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Method</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Bank / Wallet</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Requested</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.payouts?.map((p, idx) => (
                  <TableRow key={p.id} className={idx % 2 === 1 ? 'even:bg-muted/30' : ''}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-[13px] font-medium">{methodLabels[p.method] || p.method}</TableCell>
                    <TableCell className="text-[13px] font-medium">{p.bankName || '-'}</TableCell>
                    <TableCell className="text-right text-[13px] font-medium">RM {p.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${payoutStatusColors[p.status] || ''}`}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.requestedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.processedAt ? new Date(p.processedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Request Payout Dialog */}
      <Dialog open={showPayout} onOpenChange={setShowPayout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>Withdraw your earnings to your bank account or e-wallet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <span className="text-muted-foreground">Available balance: </span>
              <span className="font-bold text-shopee">RM {data?.summary?.availableAmount.toFixed(2) || '0.00'}</span>
            </div>
            <div>
              <Label>Amount (RM)</Label>
              <Input type="number" value={payoutForm.amount} onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })} placeholder="Enter amount" />
            </div>
            <div>
              <Label>Payout Method</Label>
              <Select value={payoutForm.method} onValueChange={(v) => setPayoutForm({ ...payoutForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {payoutForm.method === 'bank_transfer' ? (
              <div className="space-y-3">
                <div><Label>Bank Name</Label><Input value={payoutForm.bankName} onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })} placeholder="e.g. Maybank" /></div>
                <div><Label>Account Number</Label><Input value={payoutForm.accountNo} onChange={(e) => setPayoutForm({ ...payoutForm, accountNo: e.target.value })} placeholder="Enter account number" /></div>
                <div><Label>Account Name</Label><Input value={payoutForm.accountName} onChange={(e) => setPayoutForm({ ...payoutForm, accountName: e.target.value })} placeholder="Enter account name" /></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div><Label>E-Wallet Provider</Label><Input value={payoutForm.bankName} onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })} placeholder="e.g. Touch n Go" /></div>
                <div><Label>Phone Number</Label><Input value={payoutForm.accountNo} onChange={(e) => setPayoutForm({ ...payoutForm, accountNo: e.target.value })} placeholder="Enter phone number" /></div>
              </div>
            )}
            <div><Label>Note (Optional)</Label><Input value={payoutForm.note} onChange={(e) => setPayoutForm({ ...payoutForm, note: e.target.value })} placeholder="Any additional notes" /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayout(false)}>Cancel</Button>
            <Button className="bg-shopee hover:bg-shopee-dark text-white" onClick={() => requestMutation.mutate(payoutForm)} disabled={requestMutation.isPending}>
              {requestMutation.isPending ? 'Requesting...' : 'Request Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={(open) => { setShowGoalDialog(open); if (!open) resetGoalForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Update your earning goal details' : 'Set a new earning target to track your progress'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Goal Name</Label>
              <Input
                value={goalForm.name}
                onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                placeholder="e.g. Monthly Target"
              />
            </div>
            <div>
              <Label>Target Amount (RM)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">RM</span>
                <Input
                  type="number"
                  className="pl-12"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <Label>Period</Label>
              <Select value={goalForm.period} onValueChange={(v) => setGoalForm({ ...goalForm, period: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {goalForm.period === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={goalForm.startDate}
                    onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={goalForm.endDate}
                    onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowGoalDialog(false); resetGoalForm() }}>Cancel</Button>
            <Button
              className="btn-shopee"
              onClick={handleSaveGoal}
              disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
            >
              {createGoalMutation.isPending || updateGoalMutation.isPending ? 'Saving...' : (editingGoal ? 'Update Goal' : 'Create Goal')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={(open) => { setShowUpdateDialog(open); if (!open) { setUpdatingGoalId(null); setUpdateAmount('') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>Add your latest earnings to this goal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {updatingGoalId && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <span className="text-muted-foreground">Current: </span>
                <span className="font-bold">
                  {formatRM(goalsData?.goals?.find((g) => g.id === updatingGoalId)?.currentAmount || 0)}
                </span>
              </div>
            )}
            <div>
              <Label>Amount to Add (RM)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">RM</span>
                <Input
                  type="number"
                  className="pl-12"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowUpdateDialog(false); setUpdatingGoalId(null); setUpdateAmount('') }}>Cancel</Button>
            <Button
              className="btn-shopee"
              onClick={() => {
                if (!updateAmount || Number(updateAmount) <= 0 || !updatingGoalId) return
                updateProgressMutation.mutate({ id: updatingGoalId, amount: Number(updateAmount) })
              }}
              disabled={updateProgressMutation.isPending || !updateAmount || Number(updateAmount) <= 0}
            >
              {updateProgressMutation.isPending ? 'Updating...' : 'Add Progress'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
