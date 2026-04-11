import { Metadata } from 'next'
import { PricingPage } from '@/components/pricing/pricing-page'

export const metadata: Metadata = {
  title: 'Pricing — TheViralFinds',
  description: 'Choose the right plan for your Shopee affiliate business. Free, Pro, and Enterprise tiers available.',
}

export default function PricingRoutePage() {
  return <PricingPage />
}
