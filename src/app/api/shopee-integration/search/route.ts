import { NextRequest, NextResponse } from 'next/server'

const MOCK_PRODUCTS = [
  { id: 'sp-001', name: 'TWS Wireless Bluetooth Earbuds Pro', price: 29.90, originalPrice: 59.90, rating: 4.8, sold: 15420, category: 'Electronics', shopName: 'TechMart Official Store', shopeeUrl: 'https://shopee.com.my/tws-wireless-earbuds-pro-i.123456789.901234', commission: 5.5 },
  { id: 'sp-002', name: 'Men\'s Casual Slim Fit Cotton T-Shirt', price: 19.90, originalPrice: 39.90, rating: 4.6, sold: 28340, category: 'Fashion', shopName: 'FashionHub MY', shopeeUrl: 'https://shopee.com.my/mens-casual-tshirt-i.234567890.123456', commission: 4.0 },
  { id: 'sp-003', name: 'Korean Skincare Set 7-in-1 Bundle', price: 45.90, originalPrice: 89.90, rating: 4.9, sold: 9870, category: 'Beauty', shopName: 'GlowUp Beauty', shopeeUrl: 'https://shopee.com.my/korean-skincare-set-i.345678901.234567', commission: 6.0 },
  { id: 'sp-004', name: 'Smart LED Desk Lamp with USB Charging', price: 35.90, originalPrice: 69.90, rating: 4.7, sold: 7650, category: 'Home', shopName: 'HomeDecor Plus', shopeeUrl: 'https://shopee.com.my/smart-led-desk-lamp-i.456789012.345678', commission: 5.0 },
  { id: 'sp-005', name: 'Organic Turmeric Ginger Tea 30 Sachets', price: 15.90, originalPrice: 25.90, rating: 4.5, sold: 12300, category: 'Health', shopName: 'HerbalVita Store', shopeeUrl: 'https://shopee.com.my/turmeric-ginger-tea-i.567890123.456789', commission: 4.5 },
  { id: 'sp-006', name: 'Portable Blender USB Rechargeable 400ml', price: 22.90, originalPrice: 49.90, rating: 4.4, sold: 19450, category: 'Home', shopName: 'KitchenGadget MY', shopeeUrl: 'https://shopee.com.my/portable-blender-usb-i.678901234.567890', commission: 5.0 },
  { id: 'sp-007', name: 'Wireless Gaming Mouse RGB 16000 DPI', price: 39.90, originalPrice: 79.90, rating: 4.7, sold: 8900, category: 'Electronics', shopName: 'GameZone Official', shopeeUrl: 'https://shopee.com.my/wireless-gaming-mouse-i.789012345.678901', commission: 5.5 },
  { id: 'sp-008', name: 'Women\'s Running Shoes Breathable Mesh', price: 49.90, originalPrice: 99.90, rating: 4.6, sold: 6700, category: 'Fashion', shopName: 'SneakerWorld MY', shopeeUrl: 'https://shopee.com.my/womens-running-shoes-i.890123456.789012', commission: 4.0 },
  { id: 'sp-009', name: 'Vitamin C Serum 30ml Anti-Aging', price: 18.90, originalPrice: 38.90, rating: 4.8, sold: 22100, category: 'Beauty', shopName: 'SkinLab Official', shopeeUrl: 'https://shopee.com.my/vitamin-c-serum-30ml-i.901234567.890123', commission: 6.0 },
  { id: 'sp-010', name: 'Nasi Lemak Paste Mix 10 Sachets', price: 8.90, originalPrice: 15.90, rating: 4.3, sold: 31200, category: 'Food', shopName: ' MalaysianKitchen', shopeeUrl: 'https://shopee.com.my/nasi-lemak-paste-i.012345678.901234', commission: 3.5 },
  { id: 'sp-011', name: 'USB-C Hub 7-in-1 Multiport Adapter', price: 32.90, originalPrice: 65.90, rating: 4.5, sold: 11200, category: 'Electronics', shopName: 'TechConnect MY', shopeeUrl: 'https://shopee.com.my/usbc-hub-7in1-i.111222333.444555', commission: 5.5 },
  { id: 'sp-012', name: 'Collagen Powder Mix Fruit Flavor 20 Sachets', price: 28.90, originalPrice: 55.90, rating: 4.7, sold: 14600, category: 'Health', shopName: 'WellnessLab Store', shopeeUrl: 'https://shopee.com.my/collagen-powder-mix-i.555666777.888999', commission: 4.5 },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const query = (body.query || '').toLowerCase()
    const category = body.category || 'all'

    let results = [...MOCK_PRODUCTS]

    if (query && query !== '') {
      results = results.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.shopName.toLowerCase().includes(query)
      )
    }

    if (category && category !== 'all') {
      results = results.filter(p => p.category === category)
    }

    // Shuffle for variety
    results.sort(() => Math.random() - 0.5)

    return NextResponse.json({
      query: body.query || '',
      results: results.slice(0, 12),
      total: results.length,
      shopeeSearchUrl: `https://shopee.com.my/search?keyword=${encodeURIComponent(body.query || '')}`,
    })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
