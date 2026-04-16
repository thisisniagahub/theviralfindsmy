'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useTheme } from 'next-themes'
import {
  LayoutGrid,
  Package,
  Paperclip,
  LineChart,
  Divide,
  Rocket,
  Coins,
  Settings2,
  BellDot,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crown,
  Bot,
  Star,
  Activity,
  Globe,
  BrainCircuit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

const navItems = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutGrid, theme: 'blue' },
  { id: 'products', path: '/products', label: 'Products', icon: Package, theme: 'shopee' },
  { id: 'links', path: '/links', label: 'Affiliate Links', icon: Paperclip, theme: 'shopee' },
  { id: 'analytics', path: '/analytics', label: 'Analytics', icon: LineChart, theme: 'blue' },
  { id: 'calculator', path: '/calculator', label: 'Calculator', icon: Divide, theme: 'blue' },
  { id: 'campaigns', path: '/campaigns', label: 'Campaigns', icon: Rocket, theme: 'shopee', badge: '3' },
  { id: 'leaderboard', path: '/leaderboard', label: 'Leaderboard', icon: Crown, theme: 'gold' },
  { id: 'agent-office', path: '/agent-office', label: 'Agent Office', icon: Bot, theme: 'purple' },
  { id: 'achievements', path: '/achievements', label: 'Achievements', icon: Star, theme: 'gold' },
  { id: 'activity', path: '/activity', label: 'Activity', icon: Activity, theme: 'slate' },
  { id: 'shopee-integration', path: '/shopee-integration', label: 'Shopee Integration', icon: Globe, theme: 'slate' },
  { id: 'openclaw', path: '/openclaw', label: 'OpenClaw AI', icon: BrainCircuit, theme: 'purple', badge: 'AI' },
  { id: 'notifications', path: '/notifications', label: 'Notifications', icon: BellDot, theme: 'slate', isNotification: true },
  { id: 'earnings', path: '/earnings', label: 'Earnings', icon: Coins, theme: 'green' },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings2, theme: 'slate' },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const { setTheme, resolvedTheme, theme } = useTheme()
  const { data: session } = useSession()
  const pathname = usePathname()

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
  })

  const unreadCount = notifData?.unreadCount || 0

  return (
    <div className="flex flex-col h-full glass-sidebar">
      {/* Logo */}
      <div className="flex items-center justify-center border-b border-border h-[80px] relative pointer-events-none mb-2">
        {sidebarOpen ? (
          <img src="/logo-full.png" alt="TheViralFinds" className="absolute h-[250px] w-auto object-contain" />
        ) : (
          <img src="/logo-icon.png" alt="Icon" className="absolute h-[150px] w-auto object-contain" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = item.path === '/'
            ? pathname === '/'
            : pathname === item.path || pathname.startsWith(item.path + '/')
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
            >
              <Link
                href={item.path}
                onClick={() => onNavigate?.()}
                className={cn(
                  'flex items-center gap-3 w-full px-2 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden',
                  isActive
                    ? 'bg-shopee/5 text-shopee nav-active'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                {/* Unique Icon Container */}
                <div className={cn(
                  'sidebar-icon-container flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
                  `icon-theme-${item.theme}`,
                  isActive && 'scale-110'
                )}>
                  <div className="sidebar-icon-glow" />
                  <Icon className="w-5 h-5 relative z-10" />
                </div>

                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="truncate font-semibold tracking-tight"
                  >
                    {item.label}
                  </motion.span>
                )}

                {sidebarOpen && item.badge && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-shopee/10 text-shopee border-0 font-bold">
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

                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute right-0 w-1.5 h-6 bg-shopee rounded-l-full shadow-[0_0_15px_rgba(238,77,45,0.6)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </Link>
            </motion.div>
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
              <span className="text-sm font-semibold truncate text-foreground/90">
                {session?.user?.name || session?.user?.email || 'User'}
              </span>
              <span className="text-[10px] text-shopee font-bold tracking-tight">THE VIRAL FINDS PRO</span>
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
            <SheetDescription className="sr-only">
              Navigate between dashboard sections and account tools.
            </SheetDescription>
            <SidebarContent onNavigate={() => { }} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
