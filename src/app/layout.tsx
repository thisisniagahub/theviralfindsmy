import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeClientProvider } from '@/components/providers/theme-provider'
import { SessionClientProvider } from '@/components/providers/session-provider'
import { QueryProvider } from '@/components/providers/query-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Shopee Affiliate Manager Pro',
  description: 'Empowering Malaysian affiliates with powerful analytics and link management tools',
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
              {children}
              <Toaster />
            </QueryProvider>
          </SessionClientProvider>
        </ThemeClientProvider>
      </body>
    </html>
  )
}
