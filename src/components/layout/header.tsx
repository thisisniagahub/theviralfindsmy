'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAppStore } from '@/store/app-store'
import { Bell, Search, X, CheckCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useQuery } from '@tanstack/react-query'

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Product Discovery',
  '/links': 'Affiliate Links',
  '/analytics': 'Analytics',
  '/calculator': 'Commission Calculator',
  '/campaigns': 'Campaigns',
  '/leaderboard': 'Leaderboard',
  '/agent-office': 'Agent Office',
  '/achievements': 'Achievements',
  '/activity': 'Activity Feed',
  '/earnings': 'Earnings & Payouts',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
  '/referral': 'Referral',
  '/shopee-integration': 'Shopee Integration',
  '/openclaw': 'OpenClaw AI',
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { setSearchQuery: setGlobalSearchQuery } = useAppStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications-header'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
  })

  const unreadCount = notifData?.unreadCount || 0
  const headerNotifs = notifData?.notifications?.slice(0, 4) || []

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (localSearchQuery.trim()) {
      setGlobalSearchQuery(localSearchQuery.trim())
      router.push('/links')
      setSearchOpen(false)
      setLocalSearchQuery('')
    }
  }

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', { method: 'PUT' })
    refetch()
  }

  const currentPageName = pageNames[pathname] || 'Dashboard'

  return (
    <header className="sticky top-0 z-40 glass-header safe-area-inset-top transition-all duration-300">
      <div className="flex items-center justify-between h-14 px-3 lg:h-16 lg:px-6">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-4 pl-12 lg:pl-0">
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Breadcrumb className="hidden sm:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-muted-foreground">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  {currentPageName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right: Search, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search links, products..."
              className="pl-9 w-64 h-9 bg-muted/50"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
            />
          </form>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center bg-shopee text-white text-[10px] border-0 badge-pulse">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-xs text-shopee hover:text-shopee-dark"
                    onClick={handleMarkAllRead}
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {headerNotifs.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                headerNotifs.map((notif: { id: string; title: string; description: string; timestamp: string; read: boolean }) => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3">
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-sm font-medium">{notif.title}</span>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-shopee ml-auto flex-shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">{notif.description}</span>
                    <span className="text-xs text-shopee">
                      {new Date(notif.timestamp).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-shopee text-sm font-medium" onClick={() => router.push('/notifications')}>
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-shopee/10 text-shopee text-xs font-bold">
                    {(session?.user?.name || session?.user?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  {session?.user?.name || session?.user?.email || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/earnings')}>Earnings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-border bg-background">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search links, products..."
              className="pl-9 h-9 bg-muted/50"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => { setSearchOpen(false); setLocalSearchQuery('') }}
            >
              <X className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </header>
  )
}
