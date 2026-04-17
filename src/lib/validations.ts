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

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
  budget: z.coerce.number().positive().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
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

// Additional API validation schemas
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export const shortCodeSchema = z.object({
  shortCode: z.string().min(3).max(50),
})

export const analyticsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const shareLinkSchema = z.object({
  platform: z.enum(['facebook', 'twitter', 'whatsapp', 'telegram', 'email']).optional(),
  customMessage: z.string().max(500).optional(),
})

export const conversionTrackSchema = z.object({
  linkId: z.string().uuid(),
  amount: z.number().positive(),
  commission: z.number().min(0),
})

export const activityLogSchema = z.object({
  action: z.string().min(1).max(100),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const requestPayoutSchema = createPayoutSchema

// Social Scheduler schemas
export const socialScheduleSchema = z.object({
  action: z.enum(['schedule', 'publish', 'generate']),
  platform: z.enum(['tiktok', 'instagram', 'facebook', 'all']).default('all'),
  type: z.enum(['product', 'trending', 'flash']).default('product'),
  params: z.object({
    product: z.string().optional(),
    price: z.number().optional(),
    commission: z.number().optional(),
    category: z.string().optional(),
    count: z.number().optional(),
    discount: z.number().optional(),
  }).optional(),
  scheduledAt: z.string().datetime().optional(),
  content: z.array(z.string()).optional(),
})

// Shopee Office Agent schemas
export const updateAgentSchema = z.object({
  agentId: z.string().min(1).optional(),
  status: z.enum(['idle', 'writing', 'researching', 'executing', 'syncing', 'error']).optional(),
  state: z.enum(['idle', 'writing', 'researching', 'executing', 'syncing', 'error']).optional(),
  detail: z.string().max(500).optional(),
  authStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
})

export const bulkUpdateAgentSchema = z.object({
  status: z.enum(['idle', 'writing', 'researching', 'executing', 'syncing', 'error']),
})

export const joinOfficeSchema = z.object({
  name: z.string().min(1).max(32),
  joinKey: z.string().min(1),
  state: z.enum(['idle', 'writing', 'researching', 'executing', 'syncing', 'error']).optional(),
  detail: z.string().max(500).optional(),
})

// OpenClaw schemas
export const cronJobSchema = z.object({
  name: z.string().min(1).max(100),
  schedule: z.string().min(1), // cron expression
  message: z.string().min(1).max(2000),
  session: z.enum(['isolated', 'main']).optional().default('main'),
  tz: z.string().optional(),
  announce: z.boolean().optional(),
})

export const hookRequestSchema = z.object({
  type: z.enum(['wake', 'agent']),
  text: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  mode: z.enum(['now', 'next-heartbeat']).optional().default('now'),
  name: z.string().optional(),
  agentId: z.string().optional(),
  model: z.string().optional(),
  thinking: z.string().optional(),
  wakeMode: z.enum(['now', 'next-heartbeat']).optional(),
  deliver: z.boolean().optional(),
  channel: z.string().optional(),
  to: z.string().optional(),
}).refine((data) => {
  if (data.type === 'wake') return !!data.text
  if (data.type === 'agent') return !!data.message
  return true
}, {
  message: 'text is required for wake hooks, message is required for agent hooks',
})

// Calculator schema (already exists but adding for consistency)
export const calculatorSchema = z.object({
  price: z.number().min(0, 'Price must be non-negative'),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100'),
  clicks: z.number().min(0, 'Clicks must be non-negative'),
  conversionRate: z.number().min(0).max(100, 'Conversion rate must be between 0 and 100'),
})
