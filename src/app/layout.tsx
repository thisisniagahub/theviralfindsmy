import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeClientProvider } from '@/components/providers/theme-provider'
import { SessionClientProvider } from '@/components/providers/session-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { ServiceWorkerProvider } from '@/components/providers/sw-provider'
import { AppShell } from '@/components/app-shell'
import { PWAProvider } from '@/components/pwa/pwa-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'TheViralFinds — Shopee Affiliate Intelligence',
  description: 'AI-powered Shopee affiliate management and intelligence dashboard',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#EE4D2D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeClientProvider>
          <SessionClientProvider>
            <QueryProvider>
              <ServiceWorkerProvider>
                <PWAProvider>
                  <AppShell>{children}</AppShell>
                </PWAProvider>
              </ServiceWorkerProvider>
              <Toaster />
            </QueryProvider>
          </SessionClientProvider>
        </ThemeClientProvider>
      </body>
    </html>
  )
}
