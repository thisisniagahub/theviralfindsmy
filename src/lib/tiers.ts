/**
 * Subscription Tiers & Feature Gates
 * Defines Free, Pro, and Enterprise tiers with feature restrictions.
 */

export type TierId = 'free' | 'pro' | 'enterprise'

export interface SubscriptionTier {
  id: TierId
  name: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  description: string
  features: string[]
  limits: {
    maxLinks: number
    maxCampaigns: number
    maxAICalls: number
    maxReports: number
    hasAnalytics: boolean
    hasAITools: boolean
    hasTeamAccess: boolean
    hasAPI: boolean
    hasWhiteLabel: boolean
    prioritySupport: boolean
  }
  cta: string
  popular?: boolean
}

export const TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'MYR',
    interval: 'monthly',
    description: 'Get started with basic affiliate tools',
    features: [
      'Up to 5 affiliate links',
      'Basic analytics dashboard',
      'Click tracking',
      'Manual reports',
      'Email support',
    ],
    limits: {
      maxLinks: 5,
      maxCampaigns: 1,
      maxAICalls: 0,
      maxReports: 1,
      hasAnalytics: true,
      hasAITools: false,
      hasTeamAccess: false,
      hasAPI: false,
      hasWhiteLabel: false,
      prioritySupport: false,
    },
    cta: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    currency: 'MYR',
    interval: 'monthly',
    description: 'Everything you need to scale your affiliate business',
    features: [
      'Unlimited affiliate links',
      'Advanced analytics + forecasting',
      'AI-powered insights & content',
      'NiagaBot integration (all tools)',
      'Automated scheduled reports',
      'Priority support',
      'Custom domain support',
    ],
    limits: {
      maxLinks: Infinity,
      maxCampaigns: Infinity,
      maxAICalls: 500,
      maxReports: Infinity,
      hasAnalytics: true,
      hasAITools: true,
      hasTeamAccess: false,
      hasAPI: true,
      hasWhiteLabel: false,
      prioritySupport: true,
    },
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    currency: 'MYR',
    interval: 'monthly',
    description: 'For agencies and teams managing multiple affiliates',
    features: [
      'Everything in Pro',
      'Team management (up to 10)',
      'White-label dashboard',
      'API access & webhooks',
      'Multi-merchant support',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    limits: {
      maxLinks: Infinity,
      maxCampaigns: Infinity,
      maxAICalls: Infinity,
      maxReports: Infinity,
      hasAnalytics: true,
      hasAITools: true,
      hasTeamAccess: true,
      hasAPI: true,
      hasWhiteLabel: true,
      prioritySupport: true,
    },
    cta: 'Contact Sales',
  },
]

// Feature gate helpers
export function hasFeature(tier: TierId, feature: keyof SubscriptionTier['limits']): boolean {
  const t = TIERS.find(t => t.id === tier)
  return t ? !!t.limits[feature] : false
}

export function getLimit(tier: TierId, limit: keyof SubscriptionTier['limits']): number | boolean {
  const t = TIERS.find(t => t.id === tier)
  return t ? t.limits[limit] : false
}

export function canCreateLink(tier: TierId, currentCount: number): boolean {
  const t = TIERS.find(t => t.id === tier)
  return t ? currentCount < t.limits.maxLinks : false
}

export function getTierByName(name: string): TierId {
  const tier = TIERS.find(t => t.name.toLowerCase() === name.toLowerCase())
  return tier?.id || 'free'
}
