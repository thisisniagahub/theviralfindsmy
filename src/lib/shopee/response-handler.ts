/**
 * Shopee Response Handler — DRY utility for consistent error handling
 *
 * Replaces 10+ identical try-catch patterns across Shopee lib files.
 */

interface ShopeeResponse<T> {
  data: T | null
  error: string | null
}

/**
 * Wrap a Shopee API call with standardized error handling.
 *
 * @param operation - Description of the operation (e.g., 'fetch order')
 * @param fn - Async function that performs the API call
 * @returns { data, error } tuple
 */
export async function handleShopeeResponse<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<ShopeeResponse<T>> {
  try {
    const response = await fn()

    // Check for Shopee error format
    const resp = response as any
    if (resp?.error || resp?.message?.toLowerCase()?.includes('error')) {
      console.warn(
        `[Shopee ${operation}] API returned error:`,
        resp.message || resp.error,
      )
      return { data: null, error: resp.message || `Failed to ${operation}` }
    }

    return { data: response as T, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Shopee ${operation}]`, message)
    return { data: null, error: `Failed to ${operation}: ${message}` }
  }
}

export type { ShopeeResponse }
