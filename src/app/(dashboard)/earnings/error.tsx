'use client'

import { DashboardRouteError } from '@/components/layout/dashboard-route-error'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardRouteError title="Earnings" error={error} reset={reset} />
}

