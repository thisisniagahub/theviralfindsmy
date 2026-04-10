'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import { useToast } from '@/hooks/use-toast'
import {
  Key, User, Percent, Bell, Globe, Save, Shield,
} from 'lucide-react'

export function SettingsPage() {
  const { setTheme } = useTheme()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  const [formData, setFormData] = useState<Record<string, string>>({})

  // Sync data when loaded
  const currentSettings = settings || formData

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast({ title: 'Settings saved!', description: 'Your settings have been updated successfully.' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    },
  })

  const handleSave = () => {
    saveMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your account and application settings</p>
        </div>
        <Button className="btn-shopee" onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* API Configuration */}
      <Card className="card-accent border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-shopee/10 text-shopee"><Key className="w-5 h-5" /></div>
            <div>
              <CardTitle className="text-base">Shopee API Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">Your API credentials for Shopee affiliate program</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
              Account Verified
            </Badge>
          </div>
          <div>
            <Label>API Key</Label>
            <Input
              type="password"
              value={formData.api_key !== undefined ? formData.api_key : (currentSettings?.api_key || '')}
              onChange={(e) => updateField('api_key', e.target.value)}
              placeholder="Enter your Shopee API key"
            />
            <p className="text-xs text-muted-foreground mt-1">Your API key is encrypted and stored securely</p>
          </div>
          <div>
            <Label>Shopee Username</Label>
            <Input
              value={formData.shopee_username !== undefined ? formData.shopee_username : (currentSettings?.shopee_username || '')}
              onChange={(e) => updateField('shopee_username', e.target.value)}
              placeholder="Your Shopee username"
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="card-accent border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600"><User className="w-5 h-5" /></div>
            <div>
              <CardTitle className="text-base">Profile Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Your personal information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input
              value={formData.shopee_username !== undefined ? formData.shopee_username : (currentSettings?.shopee_username || '')}
              onChange={(e) => updateField('shopee_username', e.target.value)}
              placeholder="Display name"
            />
          </div>
          <div>
            <Label>Notification Email</Label>
            <Input
              type="email"
              value={formData.notification_email !== undefined ? formData.notification_email : (currentSettings?.notification_email || '')}
              onChange={(e) => updateField('notification_email', e.target.value)}
              placeholder="your@email.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Commission */}
      <Card className="card-accent border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600"><Percent className="w-5 h-5" /></div>
            <div>
              <CardTitle className="text-base">Commission Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Configure commission rates and payout thresholds</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Default Commission Rate (%)</Label>
              <Input
                type="number"
                value={formData.default_commission_rate !== undefined ? formData.default_commission_rate : (currentSettings?.default_commission_rate || '')}
                onChange={(e) => updateField('default_commission_rate', e.target.value)}
                placeholder="10"
              />
            </div>
            <div>
              <Label>Minimum Payout (RM)</Label>
              <Input
                type="number"
                value={formData.min_payout_amount !== undefined ? formData.min_payout_amount : (currentSettings?.min_payout_amount || '')}
                onChange={(e) => updateField('min_payout_amount', e.target.value)}
                placeholder="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="card-accent border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600"><Bell className="w-5 h-5" /></div>
            <div>
              <CardTitle className="text-base">Notification Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Control your notification preferences</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive email alerts for conversions and payouts</p>
            </div>
            <Switch
              checked={formData.email_notifications !== undefined ? formData.email_notifications === 'true' : (currentSettings?.email_notifications === 'true')}
              onCheckedChange={(checked) => updateField('email_notifications', String(checked))}
            />
          </div>
          <Separator />
          <div>
            <Label>Webhook URL</Label>
            <Input
              value={formData.webhook_url !== undefined ? formData.webhook_url : (currentSettings?.webhook_url || '')}
              onChange={(e) => updateField('webhook_url', e.target.value)}
              placeholder="https://example.com/webhook"
            />
            <p className="text-xs text-muted-foreground mt-1">Receive real-time webhook notifications</p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="card-accent border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600"><Globe className="w-5 h-5" /></div>
            <div>
              <CardTitle className="text-base">Appearance</CardTitle>
              <p className="text-sm text-muted-foreground">Customize the look and feel</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme('light')}
                className="dark:hidden"
              >
                Light
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme('dark')}
                className="hidden dark:block"
              >
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
