import { NextRequest, NextResponse } from 'next/server'

const MOCK_PRODUCTS = [
  { id: 'sp_001', name: 'Samsung Galaxy S24 Ultra', price: 3999.00, originalPrice: 4499.00, image: '/products/airpods-pro.png', rating: 4.8, sold: 15200, category: 'Electronics', shop: 'Samsung Official Store' },
  { id: 'sp_002', name: 'Apple AirPods Pro 2', price: 899.00, originalPrice: 1099.00, image: '/products/airpods-pro.png', rating: 4.9, sold: 32100, category: 'Electronics', shop: 'Apple Official Store' },
  { id: 'sp_003', name: 'Nike Air Max 270', price: 429.00, originalPrice: 599.00, image: '/products/running-shoes.png', rating: 4.7, sold: 8900, category: 'Fashion', shop: 'Nike Official Store' },
  { id: 'sp_004', name: 'Innisfree Green Tea Serum', price: 79.90, originalPrice: 99.90, image: '/products/innisfree-serum.png', rating: 4.6, sold: 45200, category: 'Beauty', shop: 'Innisfree MY' },
  { id: 'sp_005', name: 'IKEA KALLAX Shelf Unit', price: 149.00, originalPrice: 199.00, image: '/products/snack-box.png', rating: 4.5, sold: 6700, category: 'Home & Living', shop: 'IKEA Official' },
  { id: 'sp_006', name: 'Anker PowerCore 20000mAh', price: 129.00, originalPrice: 179.00, image: '/products/tws-earbuds.png', rating: 4.7, sold: 28300, category: 'Electronics', shop: 'Anker Official' },
  { id: 'sp_007', name: 'Uniqlo AIRism T-Shirt', price: 39.90, originalPrice: 49.90, image: '/products/uniqlo-tshirt.png', rating: 4.8, sold: 76500, category: 'Fashion', shop: 'Uniqlo MY' },
  { id: 'sp_008', name: 'Laneige Water Sleeping Mask', price: 89.00, originalPrice: 119.00, image: '/products/laneige-mask.png', rating: 4.7, sold: 34100, category: 'Beauty', shop: 'Laneige Official' },
  { id: 'sp_009', name: 'Xiaomi Robot Vacuum', price: 799.00, originalPrice: 1299.00, image: '/products/airpods-pro.png', rating: 4.6, sold: 5400, category: 'Home & Living', shop: 'Xiaomi Official' },
  { id: 'sp_010', name: 'Blackmores Vitamin C 1000mg', price: 65.00, originalPrice: 82.00, image: '/products/vitamin-c.png', rating: 4.8, sold: 89200, category: 'Health', shop: 'Guardian Pharmacy' },
  { id: 'sp_011', name: 'Adidas Ultraboost 23', price: 599.00, originalPrice: 799.00, image: '/products/running-shoes.png', rating: 4.7, sold: 12300, category: 'Fashion', shop: 'Adidas Official' },
  { id: 'sp_012', name: 'Dyson V12 Detect Slim', price: 2199.00, originalPrice: 2599.00, image: '/products/airpods-pro.png', rating: 4.9, sold: 4300, category: 'Home & Living', shop: 'Dyson Official' },
  { id: 'sp_013', name: 'Cetaphil Gentle Skin Cleanser', price: 42.90, originalPrice: 55.00, image: '/products/cetaphil.png', rating: 4.6, sold: 56700, category: 'Beauty', shop: 'Watson Malaysia' },
  { id: 'sp_014', name: 'TWS Earbuds Bluetooth 5.3', price: 35.90, originalPrice: 69.90, image: '/products/tws-earbuds.png', rating: 4.3, sold: 134000, category: 'Electronics', shop: 'TWS Audio Store' },
  { id: 'sp_015', name: 'Japanese Green Tea Premium', price: 58.00, originalPrice: 78.00, image: '/products/innisfree-serum.png', rating: 4.5, sold: 18900, category: 'Food', shop: 'Japanese Food Mart' },
  { id: 'sp_016', name: 'MUJI Aroma Diffuser', price: 149.00, originalPrice: 199.00, image: '/products/laneige-mask.png', rating: 4.7, sold: 9800, category: 'Home & Living', shop: 'MUJI Official' },
  { id: 'sp_017', name: 'Clarks Desert Boots', price: 349.00, originalPrice: 499.00, image: '/products/running-shoes.png', rating: 4.5, sold: 3200, category: 'Fashion', shop: 'Clarks Official' },
  { id: 'sp_018', name: 'Philips Air Fryer HD9650', price: 449.00, originalPrice: 699.00, image: '/products/snack-box.png', rating: 4.8, sold: 21700, category: 'Home & Living', shop: 'Philips Official' },
  { id: 'sp_019', name: 'Origins GinZing Moisturizer', price: 119.00, originalPrice: 149.00, image: '/products/cetaphil.png', rating: 4.6, sold: 8900, category: 'Beauty', shop: 'Origins Official' },
  { id: 'sp_020', name: 'Samsung 1TB SSD 980 Pro', price: 499.00, originalPrice: 649.00, image: '/products/tws-earbuds.png', rating: 4.9, sold: 15600, category: 'Electronics', shop: 'Samsung Official' },
  { id: 'sp_021', name: 'Puma Suede Classic XXI', price: 269.00, originalPrice: 359.00, image: '/products/uniqlo-tshirt.png', rating: 4.5, sold: 7400, category: 'Fashion', shop: 'Puma Official' },
  { id: 'sp_022', name: 'Ensure Gold 900g', price: 139.90, originalPrice: 169.90, image: '/products/ensure-gold.png', rating: 4.7, sold: 43200, category: 'Health', shop: 'Abbott Nutrition' },
  { id: 'sp_023', name: 'Shopee Exclusive Snack Box', price: 25.90, originalPrice: 39.90, image: '/products/snack-box.png', rating: 4.4, sold: 98700, category: 'Food', shop: 'Shopee Supermarket' },
  { id: 'sp_024', name: 'DJI Mini 4 Pro Drone', price: 3299.00, originalPrice: 3799.00, image: '/products/airpods-pro.png', rating: 4.9, sold: 2100, category: 'Electronics', shop: 'DJI Official' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'relevance'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')

  let filtered = [...MOCK_PRODUCTS]

  if (query) {
    const q = query.toLowerCase()
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    )
  }

  if (category && category !== 'all') {
    filtered = filtered.filter((p) => p.category === category)
  }

  switch (sort) {
    case 'price-low':
      filtered.sort((a, b) => a.price - b.price)
      break
    case 'price-high':
      filtered.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating)
      break
    case 'popular':
      filtered.sort((a, b) => b.sold - a.sold)
      break
  }

  const categories = ['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Health', 'Food']

  const total = filtered.length
  const start = (page - 1) * limit
  const paginated = filtered.slice(start, start + limit)

  return NextResponse.json({
    products: paginated,
    categories,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
