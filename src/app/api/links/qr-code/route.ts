import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'url parameter is required' }, { status: 400 })
    }

    const svg = await QRCode.toString(url, {
      type: 'svg',
      width: 256,
      margin: 2,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })

    return NextResponse.json({ svg })
  } catch (error) {
    console.error('QR Code generation error:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
