'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardRouteErrorProps {
  title?: string
  error: Error & { digest?: string }
  reset: () => void
}

export function DashboardRouteError({
  title = 'Dashboard',
  error,
  reset,
}: DashboardRouteErrorProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">{title} hit an error</h2>
            <p className="text-sm text-muted-foreground">
              The page did not finish loading correctly. Try the route again or refresh the dashboard shell.
            </p>
            {error.message ? (
              <p className="text-xs text-muted-foreground">Details: {error.message}</p>
            ) : null}
            {error.digest ? (
              <p className="text-xs text-muted-foreground">Digest: {error.digest}</p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

