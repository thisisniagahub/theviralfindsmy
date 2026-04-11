'use client'

import { useEffect } from 'react'
import { PWAInstallPrompt } from '@/components/pwa/install-prompt'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('[PWA] Service Worker registered:', reg.scope)
      }).catch(err => {
        console.log('[PWA] Service Worker registration failed:', err)
      })
    }
  }, [])

  return (
    <>
      {children}
      <PWAInstallPrompt />
    </>
  )
}
