'use client'

import { Check, X, Sparkles, Star, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TIERS, type TierId, hasFeature } from '@/lib/tiers'

export function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="text-center py-16 px-4">
        <Badge className="mb-4 bg-shopee/10 text-shopee border-shopee/20">
          <Sparkles className="w-3 h-3 mr-1" />
          Simple Pricing
        </Badge>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start free and scale as your affiliate business grows. No hidden fees.
        </p>
      </div>

      {/* Tiers */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const Icon = tier.id === 'free' ? Sparkles : tier.id === 'pro' ? Star : Crown
            return (
              <Card
                key={tier.id}
                className={`relative flex flex-col ${
                  tier.popular
                    ? 'border-2 border-shopee shadow-xl scale-105'
                    : 'border-border shadow-sm'
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-shopee text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-shopee/10 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-shopee" />
                  </div>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-foreground">
                      {tier.price === 0 ? 'Free' : `RM${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-muted-foreground text-sm">/{tier.interval}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                    {/* Show limitations */}
                    {!tier.limits.hasAITools && (
                      <li className="flex items-start gap-2 text-sm">
                        <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">No AI tools</span>
                      </li>
                    )}
                    {!tier.limits.hasTeamAccess && (
                      <li className="flex items-start gap-2 text-sm">
                        <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">No team access</span>
                      </li>
                    )}
                  </ul>
                  <Button
                    className={`w-full mt-6 ${
                      tier.popular
                        ? 'bg-shopee hover:bg-shopee-dark text-white'
                        : tier.id === 'enterprise'
                          ? 'bg-foreground text-background hover:bg-foreground/90'
                          : ''
                    }`}
                    variant={tier.popular ? 'default' : 'outline'}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Feature</th>
                  {TIERS.map(tier => (
                    <th key={tier.id} className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Affiliate Links', key: 'maxLinks' },
                  { label: 'Campaigns', key: 'maxCampaigns' },
                  { label: 'AI Tool Calls/month', key: 'maxAICalls' },
                  { label: 'Scheduled Reports', key: 'maxReports' },
                  { label: 'Advanced Analytics', key: 'hasAnalytics' },
                  { label: 'AI-Powered Tools', key: 'hasAITools' },
                  { label: 'Team Management', key: 'hasTeamAccess' },
                  { label: 'API Access', key: 'hasAPI' },
                  { label: 'White-Label', key: 'hasWhiteLabel' },
                  { label: 'Priority Support', key: 'prioritySupport' },
                ].map((row, idx) => (
                  <tr key={row.key} className={`border-b border-border ${idx % 2 === 0 ? 'bg-muted/30' : ''}`}>
                    <td className="py-3 px-4 text-sm text-foreground">{row.label}</td>
                    {TIERS.map(tier => {
                      const val = tier.limits[row.key as keyof typeof tier.limits]
                      const display = typeof val === 'boolean'
                        ? val ? '✅' : '—'
                        : val === Infinity ? 'Unlimited' : val
                      return (
                        <td key={tier.id} className="text-center py-3 px-4 text-sm text-foreground">
                          {display}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
