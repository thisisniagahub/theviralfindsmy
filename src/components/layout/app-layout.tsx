'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

const DashboardPage = dynamic(() => import('@/components/pages/dashboard-page').then(m => ({ default: m.DashboardPage })), { loading: () => <PageLoader /> })
const ProductsPage = dynamic(() => import('@/components/pages/products-page').then(m => ({ default: m.ProductsPage })), { loading: () => <PageLoader /> })
const LinksPage = dynamic(() => import('@/components/pages/links-page').then(m => ({ default: m.LinksPage })), { loading: () => <PageLoader /> })
const AnalyticsPage = dynamic(() => import('@/components/pages/analytics-page').then(m => ({ default: m.AnalyticsPage })), { loading: () => <PageLoader /> })
const CampaignsPage = dynamic(() => import('@/components/pages/campaigns-page').then(m => ({ default: m.CampaignsPage })), { loading: () => <PageLoader /> })
const EarningsPage = dynamic(() => import('@/components/pages/earnings-page').then(m => ({ default: m.EarningsPage })), { loading: () => <PageLoader /> })
const SettingsPage = dynamic(() => import('@/components/pages/settings-page').then(m => ({ default: m.SettingsPage })), { loading: () => <PageLoader /> })
const NotificationsPage = dynamic(() => import('@/components/pages/notifications-page').then(m => ({ default: m.NotificationsPage })), { loading: () => <PageLoader /> })
const CalculatorPage = dynamic(() => import('@/components/pages/calculator-page').then(m => ({ default: m.CalculatorPage })), { loading: () => <PageLoader /> })
const LeaderboardPage = dynamic(() => import('@/components/pages/leaderboard-page').then(m => ({ default: m.LeaderboardPage })), { loading: () => <PageLoader /> })
const AchievementsPage = dynamic(() => import('@/components/pages/achievements-page').then(m => ({ default: m.AchievementsPage })), { loading: () => <PageLoader /> })
const ActivityPage = dynamic(() => import('@/components/pages/activity-page').then(m => ({ default: m.ActivityPage })), { loading: () => <PageLoader /> })
const ReferralPage = dynamic(() => import('@/components/pages/referral-page').then(m => ({ default: m.ReferralPage })), { loading: () => <PageLoader /> })
const ShopeeIntegrationPage = dynamic(() => import('@/components/pages/shopee-integration-page').then(m => ({ default: m.ShopeeIntegrationPage })), { loading: () => <PageLoader /> })
const AgentOfficePage = dynamic(() => import('@/components/pages/agent-office-page').then(m => ({ default: m.AgentOfficePage })), { loading: () => <PageLoader /> })
const OpenClawPage = dynamic(() => import('@/components/pages/openclaw-page').then(m => ({ default: m.OpenClawPage })), { loading: () => <PageLoader /> })
import { ErrorBoundary } from '@/components/error-boundary'
import { NotificationProvider } from '@/components/providers/notification-provider'
import { CommandPalette } from '@/components/command-palette'
import { useState, useEffect, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingBag, BarChart3, Wallet, X, ChevronLeft, ChevronRight, Sparkles,
  Link2, Calculator, DollarSign, HelpCircle, FileText, Shield, Lock, Plus, Plug, LogIn,
} from 'lucide-react'

const mobileNavItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'analytics', label: 'Stats', icon: BarChart3 },
  { id: 'earnings', label: 'Wallet', icon: Wallet },
]

const pages: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  products: ProductsPage,
  links: LinksPage,
  analytics: AnalyticsPage,
  calculator: CalculatorPage,
  campaigns: CampaignsPage,
  leaderboard: LeaderboardPage,
  achievements: AchievementsPage,
  activity: ActivityPage,
  earnings: EarningsPage,
  settings: SettingsPage,
  notifications: NotificationsPage,
  referral: ReferralPage,
  'shopee-integration': ShopeeIntegrationPage,
  'agent-office': AgentOfficePage,
  openclaw: OpenClawPage,
}

const TOUR_STEPS = [
  {
    title: 'Welcome to TheViralFinds!',
    description: 'Track your earnings, clicks, and conversions with AI-powered intelligence.',
    icon: LayoutDashboard,
    targetId: 'tour-dashboard',
  },
  {
    title: 'Search & Generate Links',
    description: 'Find products on Shopee and generate affiliate links to start earning commissions.',
    icon: ShoppingBag,
    targetId: 'tour-products',
  },
  {
    title: 'Track Earnings & Payouts',
    description: 'Monitor your earnings, view payout history, and request withdrawals to your bank.',
    icon: Wallet,
    targetId: 'tour-earnings',
  },
  {
    title: 'Analyze Performance',
    description: 'Dive into detailed analytics with charts, funnels, and comparison tools to optimize your strategy.',
    icon: BarChart3,
    targetId: 'tour-analytics',
  },
]

export function AppLayout() {
  const { data: session, status } = useSession()
  const { activePage, setActivePage } = useAppStore()
  const PageComponent = pages[activePage] || DashboardPage
  const [showTour, setShowTour] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [autoSigningIn, setAutoSigningIn] = useState(true)

  // Auto sign-in for demo mode (SKIP_AUTH=true)
  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('credentials', {
        email: 'admin@theviralfinds.my',
        password: 'admin123',
        redirect: false,
      }).then(() => {
        setAutoSigningIn(false)
      }).catch(() => {
        setAutoSigningIn(false)
      })
    } else if (status !== 'loading') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoSigningIn(false)
    }
  }, [status])

  // All hooks must be called before any conditional returns
  useEffect(() => {
    const seen = localStorage.getItem('shopee_affiliate_tour_seen')
    if (!seen) {
      const timer = setTimeout(() => setShowTour(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const completeTour = useCallback(() => {
    setShowTour(false)
    setCurrentStep(0)
    localStorage.setItem('shopee_affiliate_tour_seen', 'true')
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      completeTour()
    }
  }, [currentStep, completeTour])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const step = TOUR_STEPS[currentStep]
  const StepIcon = step.icon

  // Auth guard: show login prompt when not authenticated (AFTER all hooks)
  if (status === 'loading' || autoSigningIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-shopee border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#EE4D2D] shadow-lg shadow-[#EE4D2D]/25">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Authentication Required</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Sila log masuk untuk mengakses dashboard TheViralFinds Intelligence.
              </p>
            </div>
            <Button
              onClick={() => signIn()}
              className="w-full h-11 bg-[#EE4D2D] hover:bg-[#D73211] text-white font-medium shadow-lg shadow-[#EE4D2D]/20"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Dashboard
            </Button>
            <p className="text-xs text-muted-foreground">
              Default: admin@theviralfinds.my / admin123
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <NotificationProvider>
    <CommandPalette />
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorBoundary pageName={activePage}>
                <PageComponent />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
        {/* Add padding-bottom on mobile for the bottom tab bar */}
        <footer className="border-t border-border bg-gradient-to-b from-muted/30 to-background mt-auto pb-16 lg:pb-0">
          {/* 3-Column Layout */}
          <div className="px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Column 1: Branding */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-shopee flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-foreground text-sm uppercase tracking-wider">TheViralFinds Pro</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Empowering Malaysian affiliates with powerful analytics and link management tools
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Quick Links</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
                  { label: 'Products', page: 'products', icon: ShoppingBag },
                  { label: 'Links', page: 'links', icon: Link2 },
                  { label: 'Analytics', page: 'analytics', icon: BarChart3 },
                  { label: 'Calculator', page: 'calculator', icon: Calculator },
                  { label: 'Earnings', page: 'earnings', icon: DollarSign },
                  { label: 'Shopee Integration', page: 'shopee-integration', icon: Plug },
                ].map((item) => (
                  <button
                    key={item.page}
                    onClick={() => setActivePage(item.page)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-shopee transition-colors text-left"
                  >
                    <item.icon className="w-3 h-3 flex-shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Support</h4>
              <div className="space-y-2">
                {[
                  { label: 'Help Center', icon: HelpCircle },
                  { label: 'API Docs', icon: FileText },
                  { label: 'Terms of Service', icon: Shield },
                  { label: 'Privacy Policy', icon: Lock },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => toast.info('Coming soon', { description: `${item.label} page is under development.` })}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-shopee transition-colors"
                  >
                    <item.icon className="w-3 h-3 flex-shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} TheViralFinds Pro — Empowering Smart Affiliates
            </p>
            <Badge variant="secondary" className="text-[10px] font-mono bg-shopee/10 text-shopee border-shopee/20">
              v6.0-VPS
            </Badge>
          </div>
        </footer>

        {/* Floating Action Button - Mobile Only */}
        <motion.button
          className="fixed bottom-20 right-4 z-30 lg:hidden w-14 h-14 rounded-full bg-shopee text-white shadow-lg shadow-shopee flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setActivePage('links') }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>

        {/* Mobile Bottom Tab Bar - replaces sidebar on mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border glass-header safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {mobileNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]',
                    isActive ? 'text-shopee' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Onboarding Tour Overlay */}
      <AnimatePresence>
        {showTour && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
              onClick={completeTour}
            />

            {/* Tour Card */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md"
            >
              <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
                {/* Close button */}
                <button
                  onClick={completeTour}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Icon + Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-shopee/10 text-shopee flex-shrink-0">
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-shopee" />
                      <span className="text-[11px] font-semibold text-shopee uppercase tracking-wider">
                        Step {currentStep + 1} of {TOUR_STEPS.length}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Progress dots */}
                <div className="flex items-center gap-2 mb-6">
                  {TOUR_STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep
                          ? 'bg-shopee w-8'
                          : idx < currentStep
                            ? 'bg-shopee/40 w-4'
                            : 'bg-muted w-4'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={completeTour}
                    className="text-muted-foreground"
                  >
                    Skip Tour
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                      className="gap-1"
                    >
                      <ChevronLeft className="w-3 h-3" /> Back
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-shopee hover:bg-shopee-dark text-white gap-1"
                    >
                      {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </NotificationProvider>
  )
}
