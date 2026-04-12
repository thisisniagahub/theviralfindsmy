'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(() => {
    // Check initial state during render, not in effect
    return typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  })

  useEffect(() => {
    // Check if dismissed before
    if (localStorage.getItem('pwa-install-dismissed')) return

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show after 3 seconds
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // For iOS Safari (no beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    if (isIOS && isSafari && !localStorage.getItem('pwa-install-dismissed')) {
      setTimeout(() => setShow(true), 5000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      setShow(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setShow(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }, [])

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <AnimatePresence>
      {show && !installed && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl p-4 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-shopee/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-shopee" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Install TheViralFinds</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isIOS
                    ? 'Tap the Share button below, then "Add to Home Screen"'
                    : 'Get quick access with the app icon on your home screen'}
                </p>
              </div>
            </div>

            {!isIOS && deferredPrompt && (
              <Button
                onClick={handleInstall}
                className="w-full h-9 bg-shopee hover:bg-shopee-dark text-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Install App
              </Button>
            )}

            {isIOS && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Share</span>
                <span className="text-foreground">→</span>
                <span>Add to Home Screen</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
