'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { KeyboardShortcutsPanel } from '@/components/keyboard-shortcuts-panel'

export function AppShell({ children }: { children: ReactNode }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const router = useRouter()

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      // Toggle shortcuts panel: ?
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShortcutsOpen(prev => !prev)
        return
      }

      // Close on Escape (handled by panel itself)

      // Go-to shortcuts
      if (e.key === 'g' || e.key === 'G') {
        // Wait for next key
        const handleNext = (e2: KeyboardEvent) => {
          const key = e2.key.toLowerCase()
          const routes: Record<string, string> = {
            d: '/',
            l: '/links',
            a: '/analytics',
            c: '/campaigns',
            e: '/earnings',
          }
          if (routes[key]) {
            e2.preventDefault()
            router.push(routes[key])
          }
          window.removeEventListener('keydown', handleNext)
        }
        window.addEventListener('keydown', handleNext, { once: true })
        return
      }

      // Refresh dashboard: R
      if (e.key === 'r' || e.key === 'R') {
        // Only on dashboard
        if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
          window.dispatchEvent(new CustomEvent('dashboard:refresh'))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return (
    <>
      {children}
      <KeyboardShortcutsPanel isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  )
}
