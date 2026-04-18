import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function DashboardRouteLoading({ label = 'Dashboard' }: { label?: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-shopee" />
        <div>
          <p className="text-sm font-medium text-foreground">Loading {label}</p>
          <p className="text-xs text-muted-foreground">Preparing the latest affiliate data and interface state.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/60">
            <CardContent className="space-y-3 p-5">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardContent className="space-y-4 p-5">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

