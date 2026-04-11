/**
 * Widget Registry — defines all available dashboard widgets.
 * Each widget has a unique ID, title, component reference, and default visibility.
 */

export interface WidgetDef {
  id: string
  title: string
  description: string
  defaultEnabled: boolean
  defaultOrder: number
  category: 'stats' | 'charts' | 'lists' | 'goals' | 'activity'
}

export const WIDGET_REGISTRY: WidgetDef[] = [
  { id: 'welcome-banner', title: 'Welcome Banner', description: 'Personalized greeting with today's earnings', defaultEnabled: true, defaultOrder: 0, category: 'stats' },
  { id: 'stat-cards', title: 'Stat Cards', description: 'Total clicks, conversions, earnings, conversion rate', defaultEnabled: true, defaultOrder: 1, category: 'stats' },
  { id: 'performance-score', title: 'Performance Score', description: 'Circular progress ring with grade breakdown', defaultEnabled: true, defaultOrder: 2, category: 'stats' },
  { id: 'vps-health', title: 'VPS Health', description: 'Real-time VPS service connectivity status', defaultEnabled: true, defaultOrder: 3, category: 'stats' },
  { id: 'quick-actions', title: 'Quick Actions', description: 'Create link, view campaigns, export, etc.', defaultEnabled: true, defaultOrder: 4, category: 'stats' },
  { id: 'earnings-chart', title: 'Earnings Chart', description: 'Area chart showing monthly/weekly earnings', defaultEnabled: true, defaultOrder: 5, category: 'charts' },
  { id: 'clicks-chart', title: 'Clicks Chart', description: 'Bar chart showing daily click volume', defaultEnabled: true, defaultOrder: 6, category: 'charts' },
  { id: 'forecast-chart', title: 'Earnings Forecast', description: 'Predictive earnings with confidence intervals', defaultEnabled: false, defaultOrder: 7, category: 'charts' },
  { id: 'goals-tracker', title: 'Earnings Goals', description: 'Active goals with progress bars', defaultEnabled: true, defaultOrder: 8, category: 'goals' },
  { id: 'expiring-links', title: 'Expiring Links', description: 'Links nearing expiration', defaultEnabled: true, defaultOrder: 9, category: 'lists' },
  { id: 'top-links', title: 'Top Links & Conversions', description: 'Recent activity tabs', defaultEnabled: true, defaultOrder: 10, category: 'lists' },
  { id: 'top-products', title: 'Top Products', description: 'Revenue-ranked product table', defaultEnabled: true, defaultOrder: 11, category: 'lists' },
  { id: 'activity-feed', title: 'Activity Feed', description: 'Real-time collapsible timeline', defaultEnabled: true, defaultOrder: 12, category: 'activity' },
]

export function getDefaultWidgetConfig() {
  return WIDGET_REGISTRY.map(w => ({
    id: w.id,
    enabled: w.defaultEnabled,
    order: w.defaultOrder,
  }))
}
