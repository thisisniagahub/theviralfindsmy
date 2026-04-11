'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  User, Link2, MousePointerClick, TrendingUp, DollarSign,
  Share2, Save, Loader2, Globe, Twitter, Instagram, Youtube,
} from 'lucide-react'

interface ProfileData {
  id: string
  displayName: string
  bio: string
  avatar: string | null
  socialLinks: {
    twitter: string
    instagram: string
    youtube: string
    website: string
  }
  publicSlug: string
  isPublic: boolean
}

export function AffiliateProfileSettings() {
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Partial<ProfileData>>({
    displayName: '',
    bio: '',
    avatar: null,
    socialLinks: { twitter: '', instagram: '', youtube: '', website: '' },
    publicSlug: '',
    isPublic: false,
  })

  const { data: existingProfile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => fetch('/api/profile').then(r => r.ok ? r.json() : null),
  })

  // Load existing profile
  useState(() => {
    if (existingProfile) {
      setProfile(existingProfile)
    }
  })

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        toast.success('Profile saved!')
      } else {
        toast.error('Failed to save profile')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }, [profile])

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/profile/${profile.publicSlug || 'my-profile'}`
    navigator.clipboard.writeText(url)
    toast.success('Profile link copied!')
  }, [profile.publicSlug])

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  return (
    <Card className="glass-card card-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Affiliate Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile.avatar || undefined} />
            <AvatarFallback className="text-2xl bg-shopee/10 text-shopee">
              {(profile.displayName || session?.user?.name || 'A')[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Label htmlFor="avatar-url">Avatar URL</Label>
            <Input
              id="avatar-url"
              placeholder="https://example.com/avatar.jpg"
              value={profile.avatar || ''}
              onChange={(e) => setProfile(p => ({ ...p, avatar: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            placeholder="Your name or brand"
            value={profile.displayName || ''}
            onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell people about your affiliate business..."
            value={profile.bio || ''}
            onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
            rows={3}
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground text-right">
            {(profile.bio || '').length}/300
          </p>
        </div>

        {/* Public Slug */}
        <div className="space-y-2">
          <Label htmlFor="public-slug">Profile URL</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">/profile/</span>
            <Input
              id="public-slug"
              placeholder="my-profile"
              value={profile.publicSlug || ''}
              onChange={(e) => setProfile(p => ({ ...p, publicSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              className="flex-1"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <Label>Social Links</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Twitter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Twitter handle"
                value={profile.socialLinks?.twitter || ''}
                onChange={(e) => setProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, twitter: e.target.value } }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Instagram handle"
                value={profile.socialLinks?.instagram || ''}
                onChange={(e) => setProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, instagram: e.target.value } }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="YouTube channel"
                value={profile.socialLinks?.youtube || ''}
                onChange={(e) => setProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, youtube: e.target.value } }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Website URL"
                value={profile.socialLinks?.website || ''}
                onChange={(e) => setProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, website: e.target.value } }))}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={saving} className="bg-shopee hover:bg-shopee-dark">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Profile
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
