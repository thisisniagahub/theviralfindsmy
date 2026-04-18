'use client'

import { DashboardRouteError } from '@/components/layout/dashboard-route-error'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardRouteError title="Shopee Integration" error={error} reset={reset} />
}
