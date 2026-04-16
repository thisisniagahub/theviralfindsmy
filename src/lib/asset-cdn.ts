/** Asset CDN utility — generates CDN URLs for static assets with local fallback */

const CDN_BASE_URL = process.env.CDN_BASE_URL || ''

/**
 * Generate a CDN URL for a static asset path.
 * Falls back to local path if CDN_BASE_URL is not configured.
 *
 * @example
 * cdnUrl('shopee-office/office_bg.webp')
 * // With CDN: 'https://cdn.example.com/shopee-office/office_bg.webp'
 * // Without CDN: '/shopee-office/office_bg.webp'
 */
export function cdnUrl(path: string): string {
  // Strip leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  if (!CDN_BASE_URL) {
    return `/${cleanPath}`
  }

  // Ensure CDN base URL doesn't have trailing slash
  const base = CDN_BASE_URL.endsWith('/') ? CDN_BASE_URL.slice(0, -1) : CDN_BASE_URL

  return `${base}/${cleanPath}`
}

/**
 * Generate a CDN URL for game assets in the shopee-office directory.
 * Convenience wrapper around cdnUrl().
 */
export function gameAssetUrl(filename: string): string {
  return cdnUrl(`shopee-office/${filename}`)
}
