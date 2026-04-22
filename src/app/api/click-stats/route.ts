import { NextResponse } from 'next/server'
import { dbFetch, isDemoMode } from '@/lib/db-safe'

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      totalClicks: 6112,
      todayClicks: 187,
      weekClicks: 1234,
      topCountries: [
        { country: 'Malaysia', count: 3840 },
        { country: 'Singapore', count: 890 },
        { country: 'Indonesia', count: 650 },
        { country: 'Thailand', count: 420 },
        { country: 'Philippines', count: 312 },
      ],
      topReferers: [
        { referer: 'Direct', count: 2340 },
        { referer: 'Facebook', count: 1560 },
        { referer: 'Instagram', count: 890 },
        { referer: 'WhatsApp', count: 670 },
        { referer: 'TikTok', count: 520 },
      ],
      recentClicks: Array.from({ length: 10 }, (_, i) => {
        const products = ['Laneige Water Mask', 'TWS Earbuds Pro', 'Running Shoes', 'Vitamin C Serum', 'Cetaphil Cleanser']
        const shortCodes = ['lnMask', 'twPro', 'rnShoe', 'vitC', 'ceta']
        return {
          id: `click-${i + 1}`,
          linkId: `link-${(i % 5) + 1}`,
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          referer: ['Direct', 'Facebook', 'Instagram', 'WhatsApp'][i % 4],
          device: i % 3 === 0 ? 'Desktop' : 'Mobile',
          country: 'MY',
          converted: i % 4 === 0,
          createdAt: new Date(Date.now() - i * 3600000).toISOString(),
          linkName: products[i % 5],
          shortCode: shortCodes[i % 5],
        }
      }),
    })
  }
  try {
    const data = await dbFetch('/click-stats')
    return NextResponse.json(data)
  } catch (error) {
    console.error('Click stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch click statistics' },
      { status: 500 }
    )
  }
}
