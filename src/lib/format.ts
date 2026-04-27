// Shared formatting utilities (T4.3)
// Centralized formatting functions for currency, numbers, dates, etc.
// Used across all pages for consistent display.

// ─── Currency ────────────────────────────────────────────────────────────────

/** Format a number as Malaysian Ringgit currency */
export function formatCurrency(amount: number, currency = 'MYR'): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return 'RM 0.00'
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Format a number as RM with 2 decimal places (legacy, used in earnings/links pages) */
export function formatRM(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

/** Format large numbers with K/M suffix (e.g. 1200 → "1.2K", 1500000 → "1.5M") */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

/** Format a percentage value */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/** Compact number using Intl.NumberFormat (e.g. 1500 → "1.5K") */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-MY', { notation: 'compact' }).format(num)
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/** Format a date as "DD Mon YYYY" (e.g. "9 Apr 2026") */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/** Format relative time from now (e.g. "Just now", "5m ago", "3h ago", "2d ago") */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}
