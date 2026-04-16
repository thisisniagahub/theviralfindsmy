/**
 * Zod validation schemas for DB Service endpoints
 * Ensures all POST/PUT inputs are validated before database operations
 */

import { z } from 'zod'

// ─── Links ──────────────────────────────────────────────────────────────────

export const createLinkBody = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  productUrl: z.string().url('Invalid product URL'),
  affiliateUrl: z.string().url('Invalid affiliate URL').optional().default(''),
  productId: z.string().optional(),
  productName: z.string().optional(),
  productImage: z.string().optional(),
  productPrice: z.coerce.number().positive().optional(),
  commission: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  campaignId: z.string().optional(),
  shortCode: z.string().optional(),
  status: z.enum(['active', 'paused', 'expired']).optional().default('active'),
  expiresAt: z.string().datetime().optional(),
})

export const updateLinkBody = z.object({
  name: z.string().min(1).max(200).optional(),
  productUrl: z.string().url().optional(),
  affiliateUrl: z.string().url().optional(),
  productId: z.string().nullable().optional(),
  productName: z.string().nullable().optional(),
  productImage: z.string().nullable().optional(),
  productPrice: z.coerce.number().positive().nullable().optional(),
  commission: z.coerce.number().min(0).nullable().optional(),
  category: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
  status: z.enum(['active', 'paused', 'expired']).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
})

// ─── Campaigns ──────────────────────────────────────────────────────────────

export const createCampaignBody = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'paused', 'completed']).optional().default('active'),
  budget: z.coerce.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// ─── Payouts ────────────────────────────────────────────────────────────────

export const createPayoutBody = z.object({
  method: z.enum(['bank_transfer', 'ewallet']).default('bank_transfer'),
  amount: z.coerce.number().positive('Amount must be positive').min(100, 'Minimum payout is RM 100'),
  bankName: z.string().min(1, 'Bank name is required').optional(),
  accountNo: z.string().min(1, 'Account number is required').optional(),
  accountName: z.string().min(1, 'Account name is required').optional(),
  note: z.string().max(500).optional(),
})

// ─── Goals ──────────────────────────────────────────────────────────────────

export const createGoalBody = z.object({
  name: z.string().min(1, 'Goal name is required').max(200),
  targetAmount: z.coerce.number().positive('Target amount must be positive'),
  period: z.enum(['monthly', 'weekly', 'yearly', 'custom']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const updateGoalBody = z
  .object({
    name: z.string().min(1, 'Goal name is required').max(200).optional(),
    targetAmount: z.coerce.number().positive('Target amount must be positive').optional(),
    period: z.enum(['monthly', 'weekly', 'yearly', 'custom']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().nullable().optional(),
    status: z.enum(['active', 'completed', 'cancelled']).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field is required',
  })

export const updateGoalProgressBody = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
})

export const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'month', 'all']).optional().default('30d'),
})

// ─── Settings ─────────────────────────────────────────────────────────────

export const updateSettingsBody = z.array(
  z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().max(500, 'Value must be 500 characters or less'),
  })
)

// ─── Notifications ──────────────────────────────────────────────────────────

export const markNotificationsReadBody = z.object({
  ids: z.array(z.string()).optional(),
})

// ─── Validation Helper ──────────────────────────────────────────────────────

export function validateBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body)
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
    throw new Error(`Validation failed: ${errors}`)
  }
  return result.data
}
