import { z } from 'zod'

export const createLinkSchema = z.object({
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

export const updateLinkSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['active', 'paused', 'expired']).optional(),
  campaignId: z.string().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'paused', 'completed']).optional().default('active'),
  budget: z.coerce.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const createPayoutSchema = z.object({
  method: z.enum(['bank_transfer', 'ewallet']).default('bank_transfer'),
  amount: z.coerce.number().positive('Amount must be positive').min(100, 'Minimum payout is RM 100'),
  bankName: z.string().min(1).optional(),
  accountNo: z.string().min(1).optional(),
  accountName: z.string().min(1).optional(),
  note: z.string().max(500).optional(),
})

export const createGoalSchema = z.object({
  name: z.string().min(1).max(200),
  targetAmount: z.coerce.number().positive(),
  period: z.enum(['monthly', 'weekly', 'yearly', 'custom']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const updateSettingsSchema = z.object({
  updates: z.array(
    z.object({
      key: z.string().min(1).max(100),
      value: z.string().max(500),
    })
  ),
}).strict()

export const bulkActionSchema = z.object({
  action: z.enum(['activate', 'pause', 'expire']),
  ids: z.array(z.string()).min(1, 'At least one ID required'),
  expiresAt: z.string().datetime().optional(),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID required'),
})

export const bulkLinkActionSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID required'),
  action: z.enum(['activate', 'pause', 'delete']),
})

export const updateGoalProgressSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
})

export const calculatorEstimateSchema = z.object({
  price: z.number().min(0, 'Price must be non-negative'),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100'),
  clicks: z.number().min(0, 'Clicks must be non-negative'),
  conversionRate: z.number().min(0).max(100, 'Conversion rate must be between 0 and 100'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const requestPayoutSchema = createPayoutSchema
