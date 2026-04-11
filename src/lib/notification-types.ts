export interface NotificationEvent {
  id: string
  type: 'conversion' | 'click' | 'payout' | 'milestone'
  title: string
  message: string
  amount?: number
  productName?: string
  timestamp: string
}
