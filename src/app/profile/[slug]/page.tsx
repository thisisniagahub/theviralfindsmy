import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, MousePointerClick, TrendingUp, DollarSign, Twitter, Instagram, Youtube, Globe, Share2 } from 'lucide-react'

interface ProfileData {
  displayName: string
  bio: string
  avatar: string | null
  socialLinks: Record<string, string>
  publicSlug: string
  stats?: {
    totalLinks: number
    totalClicks: number
    totalConversions: number
    totalEarnings: number
  }
}

async function getProfile(slug: string): Promise<ProfileData | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/profile?slug=${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const profile = await getProfile(slug)

  if (!profile) {
    return { title: 'Profile Not Found' }
  }

  return {
    title: `${profile.displayName} | TheViralFinds Affiliate`,
    description: profile.bio || `Check out ${profile.displayName}'s top Shopee affiliate picks`,
    openGraph: {
      title: `${profile.displayName} | TheViralFinds`,
      description: profile.bio,
      type: 'profile',
    },
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const profile = await getProfile(slug)

  if (!profile) {
    notFound()
  }

  const formatRM = (n: number) => `RM ${n.toFixed(2)}`
  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-shopee to-orange-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/30 shadow-xl">
            <AvatarImage src={profile.avatar || undefined} />
            <AvatarFallback className="text-3xl bg-white/20 text-white font-bold">
              {profile.displayName[0]}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          {profile.bio && (
            <p className="text-white/80 mt-2 max-w-md mx-auto">{profile.bio}</p>
          )}

          {/* Social Links */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {profile.socialLinks?.twitter && (
              <a href={`https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {profile.socialLinks?.instagram && (
              <a href={`https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {profile.socialLinks?.youtube && (
              <a href={`https://youtube.com/${profile.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {profile.socialLinks?.website && (
              <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-3xl mx-auto px-4 -mt-6">
        <Card className="shadow-lg border-border/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-shopee mb-1">
                  <Link2 className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-foreground">{profile.stats ? formatNumber(profile.stats.totalLinks) : '—'}</p>
                <p className="text-xs text-muted-foreground">Active Links</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                  <MousePointerClick className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-foreground">{profile.stats ? formatNumber(profile.stats.totalClicks) : '—'}</p>
                <p className="text-xs text-muted-foreground">Total Clicks</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-foreground">{profile.stats ? formatNumber(profile.stats.totalConversions) : '—'}</p>
                <p className="text-xs text-muted-foreground">Conversions</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                  <DollarSign className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-foreground">{profile.stats ? formatRM(profile.stats.totalEarnings) : '—'}</p>
                <p className="text-xs text-muted-foreground">Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share button */}
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(window.location.href) }}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Profile
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 mb-4">
          Powered by TheViralFinds — Shopee Affiliate Manager Pro
        </p>
      </div>
    </div>
  )
}
