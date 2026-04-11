'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Mail, Trash2, ChevronDown, Shield, Eye, UserCog } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { TeamData, TeamMemberData } from '@/lib/team-management'

const ROLE_ICONS = {
  admin: <Shield className="w-3 h-3" />,
  manager: <UserCog className="w-3 h-3" />,
  viewer: <Eye className="w-3 h-3" />,
}

const ROLE_COLORS = {
  admin: 'bg-red-500/10 text-red-600',
  manager: 'bg-blue-500/10 text-blue-600',
  viewer: 'bg-muted text-muted-foreground',
}

interface TeamManagementProps {
  team: TeamData | null
  onInvite: (email: string, role: 'manager' | 'viewer') => void
  onRemove: (memberId: string) => void
  onRoleChange: (memberId: string, role: 'admin' | 'manager' | 'viewer') => void
}

export function TeamManagementPanel({ team, onInvite, onRemove, onRoleChange }: TeamManagementProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'manager' | 'viewer'>('viewer')
  const [showInvite, setShowInvite] = useState(false)

  const handleInvite = () => {
    if (!email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }
    onInvite(email, role)
    setEmail('')
    setShowInvite(false)
    toast.success(`Invitation sent to ${email}`)
  }

  return (
    <Card className="glass-card card-accent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Management
          </CardTitle>
          <Button size="sm" onClick={() => setShowInvite(!showInvite)} className="bg-shopee hover:bg-shopee-dark">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Invite Member
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite Form */}
        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <Input
                  placeholder="colleague@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-9"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      {role}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setRole('manager')}>
                      Manager
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRole('viewer')}>
                      Viewer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" onClick={handleInvite} className="h-9 bg-shopee hover:bg-shopee-dark">
                  <Mail className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Members List */}
        <div className="space-y-2">
          {(team?.members || []).map((member: TeamMemberData) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-shopee/10 flex items-center justify-center text-sm font-medium text-shopee">
                  {member.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${ROLE_COLORS[member.role]}`}>
                  {ROLE_ICONS[member.role]}
                  <span className="ml-1 capitalize">{member.role}</span>
                </Badge>
                {member.role !== 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                    onClick={() => onRemove(member.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {(!team?.members || team.members.length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No team members yet. Invite your first member!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
