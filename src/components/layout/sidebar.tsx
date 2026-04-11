'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  ShoppingBag,
  Link2,
  BarChart3,
  Calculator,
  Megaphone,
  Wallet,
  Settings,
  Bell,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Trophy,
  Building2,
  Award,
  Activity,
  Plug,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'

const navItems = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', path: '/products', label: 'Products', icon: ShoppingBag },
  { id: 'links', path: '/links', label: 'Affiliate Links', icon: Link2 },
  { id: 'analytics', path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'calculator', path: '/calculator', label: 'Calculator', icon: Calculator },
  { id: 'campaigns', path: '/campaigns', label: 'Campaigns', icon: Megaphone, badge: '3' },
  { id: 'leaderboard', path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'agent-office', path: '/agent-office', label: 'Agent Office', icon: Building2 },
  { id: 'achievements', path: '/achievements', label: 'Achievements', icon: Award },
  { id: 'activity', path: '/activity', label: 'Activity', icon: Activity },
  { id: 'shopee-integration', path: '/shopee-integration', label: 'Shopee Integration', icon: Plug },
  { id: 'openclaw', path: '/openclaw', label: 'OpenClaw AI', icon: Zap, badge: 'AI' },
  { id: 'notifications', path: '/notifications', label: 'Notifications', icon: Bell, isNotification: true },
  { id: 'earnings', path: '/earnings', label: 'Earnings', icon: Wallet },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const { setTheme, resolvedTheme, theme } = useTheme()
  const pathname = usePathname()

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
  })

  const unreadCount = notifData?.unreadCount || 0

  return (
    <div className="flex flex-col h-full sidebar-gradient">
      {/* Logo */}
      <div className="flex items-center justify-center border-b border-border h-[80px] relative pointer-events-none">
        {sidebarOpen ? (
          <img src="/logo-full.png" alt="TheViralFinds" className="absolute h-[250px] w-auto object-contain drop-shadow-xl" />
        ) : (
          <img src="/logo-icon.png" alt="Icon" className="absolute h-[150px] w-auto object-contain drop-shadow-lg" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.path === '/'
            ? pathname === '/'
            : pathname === item.path || pathname.startsWith(item.path + '/')
          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={() => onNavigate?.()}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 nav-item-slide relative',
                isActive
                  ? 'bg-shopee/10 text-shopee dark:bg-shopee/20 nav-glow'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-shopee')} />
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.badge && (
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-shopee/10 text-shopee border-0">
                  {item.badge}
                </Badge>
              )}
              {sidebarOpen && item.isNotification && unreadCount > 0 && (
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-shopee text-white border-0 badge-pulse">
                  {unreadCount}
                </Badge>
              )}
              {!sidebarOpen && item.isNotification && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-shopee badge-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Bottom section */}
      <div className="p-3 space-y-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size={sidebarOpen ? 'sm' : 'icon'}
          className="w-full justify-start gap-3"
          onClick={() => setTheme((resolvedTheme || theme) === 'dark' ? 'light' : 'dark')}
        >
          <span className="relative w-4 h-4 inline-flex items-center justify-center">
            <Moon className="w-4 h-4 dark:hidden" />
            <Sun className="w-4 h-4 hidden dark:block" />
          </span>
          {sidebarOpen && <span className="text-sm">Toggle Theme</span>}
        </Button>

        {/* Collapse toggle (desktop only) */}
        <Button
          variant="ghost"
          size={sidebarOpen ? 'sm' : 'icon'}
          className="w-full justify-start gap-3 lg:flex hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span className="text-sm">Collapse</span>}
        </Button>

        <Separator />

        {/* User */}
        <div className={cn('flex items-center gap-3 px-2 py-2', !sidebarOpen && 'justify-center')}>
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-shopee/10 text-shopee text-xs font-bold">AA</AvatarFallback>
            </Avatar>
          </div>
          {sidebarOpen && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">Ahmad Ali</span>
              <span className="text-[10px] text-shopee font-medium">RM 2,847.50 earned</span>
            </div>
          )}
          {sidebarOpen && (
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { sidebarOpen } = useAppStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen sticky top-0 border-r border-border transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-[68px]'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button className="mobile-menu-btn">
              <Menu className="w-4 h-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent onNavigate={() => {}} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
