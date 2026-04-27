import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

// Only allow QR codes for http/https URLs
function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    // Block private/internal IPs
    const hostname = parsed.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') return false
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) return false
    if (hostname.endsWith('.internal') || hostname.endsWith('.local')) return false
    if (hostname.startsWith('169.254.')) return false
    return true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'url parameter is required' }, { status: 400 })
    }

    if (!isUrlSafe(url)) {
      return NextResponse.json({ error: 'Invalid or unsafe URL' }, { status: 400 })
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
