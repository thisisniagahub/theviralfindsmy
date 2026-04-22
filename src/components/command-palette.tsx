'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ShoppingBag, Link2, BarChart3, Calculator,
  DollarSign, Settings, Bell, Trophy, Award, Megaphone,
  Plus, Wallet, Search, ArrowRight,
  Loader2, FileText,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Page definitions ──────────────────────────────────────────────────────────

interface PageDef {
  id: string
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  keywords: string[]
}

const PAGES: PageDef[] = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard, shortcut: '⌘1', keywords: ['home', 'overview', 'stats', 'summary'] },
  { id: 'products', path: '/products', label: 'Products', icon: ShoppingBag, shortcut: '⌘2', keywords: ['shop', 'search', 'browse', 'find', 'catalog'] },
  { id: 'links', path: '/links', label: 'Affiliate Links', icon: Link2, shortcut: '⌘3', keywords: ['manage', 'short', 'url', 'affiliate'] },
  { id: 'analytics', path: '/analytics', label: 'Analytics', icon: BarChart3, shortcut: '⌘4', keywords: ['reports', 'data', 'charts', 'performance', 'traffic'] },
  { id: 'calculator', path: '/calculator', label: 'Commission Calculator', icon: Calculator, shortcut: '⌘5', keywords: ['calc', 'estimate', 'commission', 'earnings calculator'] },
  { id: 'campaigns', path: '/campaigns', label: 'Campaigns', icon: Megaphone, keywords: ['marketing', 'promo', 'promotion', 'sale'] },
  { id: 'leaderboard', path: '/leaderboard', label: 'Leaderboard', icon: Trophy, keywords: ['ranking', 'rank', 'top', 'competitors', 'affiliates'] },
  { id: 'achievements', path: '/achievements', label: 'Achievements', icon: Award, keywords: ['badges', 'rewards', 'unlocked', 'milestones'] },
  { id: 'earnings', path: '/earnings', label: 'Earnings & Payouts', icon: DollarSign, shortcut: '⌘E', keywords: ['money', 'payout', 'withdraw', 'bank', 'income', 'wallet'] },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings, shortcut: '⌘,', keywords: ['config', 'preferences', 'profile', 'api key', 'account'] },
  { id: 'notifications', path: '/notifications', label: 'Notifications', icon: Bell, keywords: ['alerts', 'inbox', 'messages', 'updates'] },
]

// ── Quick Actions ─────────────────────────────────────────────────────────────

interface ActionDef {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  keywords: string[]
  action: () => void
}

// ── Link search result type ───────────────────────────────────────────────────

interface LinkResult {
  id: string
  name: string
  productName: string
  category: string | null
  shortCode: string
  status: string
}

// ── Recent pages helpers ──────────────────────────────────────────────────────

const RECENT_KEY = 'shopee_affiliate_recent_pages'
const MAX_RECENT = 5

function getRecentPages(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addRecentPage(pageId: string) {
  try {
    const existing = getRecentPages()
    const filtered = existing.filter((p) => p !== pageId)
    const updated = [pageId, ...filtered].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {
    // localStorage might be unavailable
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchLinks, setSearchLinks] = useState<LinkResult[]>([])
  const [isSearchingLinks, setIsSearchingLinks] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Track recently visited pages
  useEffect(() => {
    if (pathname) {
      addRecentPage(pathname)
    }
  }, [pathname])

  // ── Keyboard shortcut: Cmd+K / Ctrl+K ─────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === 'k'
      ) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Fuzzy link search ──────────────────────────────────────────────────────
  const searchForLinks = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchLinks([])
      setIsSearchingLinks(false)
      return
    }
    setIsSearchingLinks(true)
    try {
      const res = await fetch(`/api/links?search=${encodeURIComponent(searchQuery)}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setSearchLinks(
          (data.links || []).map((link: Record<string, unknown>) => ({
            id: String(link.id),
            name: String(link.name || ''),
            productName: String(link.productName || ''),
            category: link.category ? String(link.category) : null,
            shortCode: String(link.shortCode || ''),
            status: String(link.status || 'active'),
          }))
        )
      }
    } catch {
      // Silently fail - the command palette should still work for navigation
      setSearchLinks([])
    } finally {
      setIsSearchingLinks(false)
    }
  }, [])

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
      searchTimerRef.current = setTimeout(() => {
        searchForLinks(value)
      }, 250)
    },
    [searchForLinks]
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])

  // ── Navigation handler ─────────────────────────────────────────────────────
  const navigateTo = useCallback(
    (pagePath: string) => {
      router.push(pagePath)
      setOpen(false)
      setQuery('')
      setSearchLinks([])
    },
    [router]
  )

  // Helper to check if a page is active
  const isPageActive = useCallback(
    (pagePath: string) => {
      if (pagePath === '/') return pathname === '/'
      return pathname === pagePath || pathname.startsWith(pagePath + '/')
    },
    [pathname]
  )

  // ── Quick actions ──────────────────────────────────────────────────────────
  const actions: ActionDef[] = [
    {
      id: 'create-link',
      label: 'Create New Link',
      icon: Plus,
      shortcut: '⌘N',
      keywords: ['new', 'add', 'create', 'generate'],
      action: () => {
        navigateTo('/links')
        // Small delay so the page loads first
        setTimeout(() => toast.info('Create Link', { description: 'Click "Add Link" to create a new affiliate link.' }), 400)
      },
    },
    {
      id: 'view-earnings',
      label: 'View Earnings',
      icon: Wallet,
      keywords: ['money', 'payout', 'income', 'balance'],
      action: () => navigateTo('/earnings'),
    },
    {
      id: 'view-analytics',
      label: 'Open Analytics',
      icon: BarChart3,
      keywords: ['reports', 'performance', 'stats', 'charts'],
      action: () => navigateTo('/analytics'),
    },
    {
      id: 'search-products',
      label: 'Search Products',
      icon: Search,
      keywords: ['shop', 'find', 'browse', 'catalog'],
      action: () => navigateTo('/products'),
    },
    {
      id: 'export-report',
      label: 'Export Report',
      icon: FileText,
      keywords: ['csv', 'pdf', 'download', 'export'],
      action: () => {
        navigateTo('/')
        setTimeout(() => toast.info('Export', { description: 'Use the export buttons on the dashboard to download reports.' }), 400)
      },
    },
  ]

  const handleActionSelect = useCallback(
    (action: ActionDef) => {
      action.action()
    },
    []
  )

  // ── Link selection handler ─────────────────────────────────────────────────
  const handleLinkSelect = useCallback(
    (link: LinkResult) => {
      navigateTo('/links')
      setTimeout(() => {
        toast('Link Found', {
          description: `${link.productName} — ${link.shortCode}`,
        })
      }, 400)
    },
    [navigateTo]
  )

  // ── Recent pages ───────────────────────────────────────────────────────────
  const recentPages = getRecentPages()
    .map((path) => PAGES.find((p) => p.path === path))
    .filter(Boolean) as PageDef[]

  const shouldShowRecent = !query && recentPages.length > 0
  const shouldShowLinks = query.length >= 2 && searchLinks.length > 0
  const shouldShowLinkLoading = query.length >= 2 && isSearchingLinks && searchLinks.length === 0

  // ── Close on open change ───────────────────────────────────────────────────
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setQuery('')
      setSearchLinks([])
      setIsSearchingLinks(false)
    }
  }, [])

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Command Palette"
      description="Search pages, links, and actions"
      className="command-palette-dialog max-w-[640px] p-0 overflow-hidden"
    >
      {/* Custom overlay animation is handled by DialogContent from shadcn */}
      <AnimatePresence>
        {open && (
          <>
            {/* Search Input */}
            <div className="relative px-3 pt-2 pb-1">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-shopee flex-shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search pages, links, actions..."
                  className={cn(
                    'flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground',
                    'py-2 text-foreground'
                  )}
                  aria-label="Search command palette"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
              {/* Empty state */}
              {!query && (
                <div className="py-8 px-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-shopee/10 flex items-center justify-center">
                    <Search className="w-5 h-5 text-shopee" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Search for anything</p>
                  <p className="text-xs text-muted-foreground">
                    Navigate pages, search links, and run actions
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                      Select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">esc</kbd>
                      Close
                    </span>
                  </div>
                </div>
              )}

              {/* No results state */}
              {query && !shouldShowLinks && !shouldShowLinkLoading && searchLinks.length === 0 && !isSearchingLinks && (
                <div className="py-8 px-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No results found</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different search term
                  </p>
                </div>
              )}

              {/* Recently Viewed Pages */}
              {shouldShowRecent && (
                <CommandGroup heading="Recently Viewed" className="px-2 py-1">
                  {recentPages.map((page) => {
                    const Icon = page.icon
                    const isActive = isPageActive(page.path)
                    return (
                      <CommandItem
                        key={`recent-${page.id}`}
                        value={`recent-${page.id} ${page.label} ${page.keywords.join(' ')}`}
                        onSelect={() => navigateTo(page.path)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                          'data-[selected=true]:bg-shopee/10 data-[selected=true]:text-shopee',
                          isActive && 'text-shopee'
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
                          isActive ? 'bg-shopee/15 text-shopee' : 'bg-muted text-muted-foreground'
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{page.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {isActive ? 'Current page' : 'Go to page'}
                          </p>
                        </div>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] text-shopee font-medium bg-shopee/10 px-1.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-shopee" />
                            Active
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* Separator when showing recent + pages */}
              {shouldShowRecent && !query && (
                <CommandSeparator className="my-1" />
              )}

              {/* All Pages (show when no search query or filtered) */}
              {!query && (
                <CommandGroup heading="Pages" className="px-2 py-1">
                  {PAGES.map((page) => {
                    const Icon = page.icon
                    const isActive = isPageActive(page.path)
                    return (
                      <CommandItem
                        key={page.id}
                        value={`${page.label} ${page.keywords.join(' ')}`}
                        onSelect={() => navigateTo(page.path)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                          'data-[selected=true]:bg-shopee/10 data-[selected=true]:text-shopee',
                          isActive && 'text-shopee'
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
                          isActive ? 'bg-shopee/15 text-shopee' : 'bg-muted text-muted-foreground'
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium flex-1">{page.label}</span>
                        {page.shortcut && (
                          <CommandShortcut className="text-[10px] font-mono">
                            {page.shortcut}
                          </CommandShortcut>
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* Separator */}
              {!query && <CommandSeparator className="my-1" />}

              {/* Quick Actions (show when no search query) */}
              {!query && (
                <CommandGroup heading="Quick Actions" className="px-2 py-1">
                  {actions.map((action) => {
                    const Icon = action.icon
                    return (
                      <CommandItem
                        key={action.id}
                        value={`${action.label} ${action.keywords.join(' ')}`}
                        onSelect={() => handleActionSelect(action)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors data-[selected=true]:bg-shopee/10 data-[selected=true]:text-shopee"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-shopee/10 text-shopee flex-shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium flex-1">{action.label}</span>
                        {action.shortcut && (
                          <CommandShortcut className="text-[10px] font-mono">
                            {action.shortcut}
                          </CommandShortcut>
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* Link Search Results */}
              {shouldShowLinks && (
                <>
                  <CommandSeparator className="my-1" />
                  <CommandGroup heading="Links" className="px-2 py-1">
                    {searchLinks.map((link) => (
                      <CommandItem
                        key={link.id}
                        value={`link-${link.id} ${link.name} ${link.productName} ${link.category || ''}`}
                        onSelect={() => handleLinkSelect(link)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors data-[selected=true]:bg-shopee/10 data-[selected=true]:text-shopee"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-shopee/10 text-shopee flex-shrink-0">
                          <Link2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{link.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="truncate">{link.productName}</span>
                            {link.category && (
                              <>
                                <span className="text-border">·</span>
                                <span className="flex-shrink-0">{link.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={cn(
                          'flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                          link.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : link.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
                        )}>
                          {link.status}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Link Loading Indicator */}
              {shouldShowLinkLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-shopee" />
                  <span>Searching links...</span>
                </div>
              )}

              {/* Filtered Pages during search */}
              {query && (
                <>
                  <CommandSeparator className="my-1" />
                  <CommandGroup heading="Pages" className="px-2 py-1">
                    {PAGES.filter((page) => {
                      const searchLower = query.toLowerCase()
                      return (
                        page.label.toLowerCase().includes(searchLower) ||
                        page.id.toLowerCase().includes(searchLower) ||
                        page.keywords.some((kw) => kw.toLowerCase().includes(searchLower))
                      )
                    }).map((page) => {
                      const Icon = page.icon
                      const isActive = isPageActive(page.path)
                      return (
                        <CommandItem
                          key={page.id}
                          value={`page-${page.id} ${page.label} ${page.keywords.join(' ')}`}
                          onSelect={() => navigateTo(page.path)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                            'data-[selected=true]:bg-shopee/10 data-[selected=true]:text-shopee',
                            isActive && 'text-shopee'
                          )}
                        >
                          <div className={cn(
                            'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
                            isActive ? 'bg-shopee/15 text-shopee' : 'bg-muted text-muted-foreground'
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium flex-1">{page.label}</span>
                          {page.shortcut && (
                            <CommandShortcut className="text-[10px] font-mono">
                              {page.shortcut}
                            </CommandShortcut>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>

                  {/* Filtered Actions during search */}
                  {actions.filter((action) => {
                    const searchLower = query.toLowerCase()
                    return (
                      action.label.toLowerCase().includes(searchLower) ||
                      action.keywords.some((kw) => kw.toLowerCase().includes(searchLower))
                    )
                  }).length > 0 && (
                    <>
                      <CommandSeparator className="my-1" />
                      <CommandGroup heading="Actions" className="px-2 py-1">
                        {actions
                          .filter((action) => {
                            const searchLower = query.toLowerCase()
                            return (
                              action.label.toLowerCase().includes(searchLower) ||
                              action.keywords.some((kw) => kw.toLowerCase().includes(searchLower))
                            )
                          })
                          .map((action) => {
                            const Icon = action.icon
                            return (
                              <CommandItem
                                key={action.id}
                                value={`action-${action.id} ${action.label} ${action.keywords.join(' ')}`}
                                onSelect={() => handleActionSelect(action)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors data-[selected=true]:bg-shopee/10 data-[selected=true]:text-shopee"
                              >
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-shopee/10 text-shopee flex-shrink-0">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium flex-1">{action.label}</span>
                              </CommandItem>
                            )
                          })}
                      </CommandGroup>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-border/40 px-3 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="inline-flex items-center rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
                <span>to toggle</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-shopee" />
                Shopee Affiliate
              </span>
            </div>
          </>
        )}
      </AnimatePresence>
    </CommandDialog>
  )
}
