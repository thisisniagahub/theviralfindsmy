// Link expiry utilities (T4.3)
// Shared helpers for calculating and displaying link expiry status.

// ─── Legacy helper (used in /api/links) ─────────────────────────────────────

export function calculateExpiry(expiresAt: Date | string | null) {
  if (!expiresAt) return { expiresIn: null, isExpired: false, expiryStatus: 'none' as const }
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const isExpired = diffMs < 0
  return {
    expiresIn: diffDays,
    isExpired,
    expiryStatus: isExpired ? 'expired' as const : diffDays <= 7 ? 'expiring_soon' as const : 'active' as const,
  }
}

// ─── Enhanced expiry status (T4.3) ───────────────────────────────────────────

export interface LinkExpiryStatus {
  isExpired: boolean
  isExpiringSoon: boolean
  daysRemaining: number | null
  label: string
  color: string
}

/**
 * Get full expiry status for display in UI components.
 * Returns human-readable label and Tailwind color class.
 */
export function getLinkExpiryStatus(
  expiresAt: Date | string | null | undefined
): LinkExpiryStatus {
  if (!expiresAt) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      daysRemaining: null,
      label: 'No expiry',
      color: 'text-muted-foreground',
    }
  }

  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  const daysRemaining = Math.ceil(diffMs / 86_400_000)

  if (daysRemaining <= 0) {
    return {
      isExpired: true,
      isExpiringSoon: false,
      daysRemaining,
      label: 'Expired',
      color: 'text-red-500',
    }
  }
  if (daysRemaining <= 3) {
    return {
      isExpired: false,
      isExpiringSoon: true,
      daysRemaining,
      label: `${daysRemaining}d left`,
      color: 'text-amber-500',
    }
  }
  return {
    isExpired: false,
    isExpiringSoon: false,
    daysRemaining,
    label: `${daysRemaining}d left`,
    color: 'text-green-500',
  }
}

/**
 * Check if a link should be auto-expired based on its expiry date.
 */
export function shouldAutoExpire(
  expiresAt: Date | string | null | undefined
): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}
