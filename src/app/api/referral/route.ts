import { NextResponse } from 'next/server'

export async function GET() {
  const data = {
    stats: {
      totalReferrals: 24,
      activeReferrals: 18,
      conversionRate: 75,
      referralEarnings: 1250.00,
    },
    referralLink: 'https://shopee-affiliate.com/ref/ahmad-ali-123',
    tier: {
      current: 'Silver',
      next: 'Gold',
      progress: 60,
    },
    history: [
      { id: '1', name: 'Siti Nurhaliza', email: 'siti.nur@email.com', status: 'active', dateJoined: '2026-01-15', earnings: 145.50 },
      { id: '2', name: 'Muhammad Amin', email: 'm.amin@email.com', status: 'active', dateJoined: '2026-01-20', earnings: 98.20 },
      { id: '3', name: 'Nurul Aisyah', email: 'nurul.a@email.com', status: 'active', dateJoined: '2026-02-03', earnings: 210.00 },
      { id: '4', name: 'Ahmad Faiz', email: 'a.faiz@email.com', status: 'inactive', dateJoined: '2026-02-10', earnings: 32.80 },
      { id: '5', name: 'Farah Diana', email: 'farah.d@email.com', status: 'active', dateJoined: '2026-02-18', earnings: 178.90 },
      { id: '6', name: 'Ismail Sabri', email: 'i.sabri@email.com', status: 'active', dateJoined: '2026-03-01', earnings: 156.30 },
      { id: '7', name: 'Putri Amelia', email: 'putri.a@email.com', status: 'inactive', dateJoined: '2026-03-12', earnings: 15.60 },
      { id: '8', name: 'Rizal Hakim', email: 'rizal.h@email.com', status: 'active', dateJoined: '2026-03-25', earnings: 88.40 },
    ],
    monthlyEarnings: [
      { month: 'Oct', earnings: 85 },
      { month: 'Nov', earnings: 145 },
      { month: 'Dec', earnings: 210 },
      { month: 'Jan', earnings: 178 },
      { month: 'Feb', earnings: 256 },
      { month: 'Mar', earnings: 320 },
    ],
  }

  return NextResponse.json(data)
}
