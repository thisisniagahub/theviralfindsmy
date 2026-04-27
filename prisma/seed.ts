/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data (order matters due to foreign keys)
  await db.clickRecord.deleteMany()
  await db.conversion.deleteMany()
  await db.affiliateLink.deleteMany()
  await db.campaign.deleteMany()
  await db.payout.deleteMany()
  await db.appSetting.deleteMany()
  await db.earningGoal.deleteMany()
  await db.notification.deleteMany()
  await db.achievement.deleteMany()
  await db.leaderboardEntry.deleteMany()
  await db.referral.deleteMany()
  await db.user.deleteMany()

  // Create default admin user
  const adminPasswordHash = await bcrypt.hash('changeme123', 12)
  const adminUser = await db.user.create({
    data: {
      id: 'user_admin',
      email: 'admin@theviralfinds.my',
      name: 'Ahmad Ali',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true,
      lastLoginAt: new Date(),
    },
  })
  console.log(`✅ Created admin user: ${adminUser.email}`)

  // Create sample affiliate users
  const affiliate1 = await db.user.create({
    data: {
      id: 'user_aff01',
      email: 'siti@example.com',
      name: 'Siti Nurhaliza',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'affiliate',
      shopeeAffId: 'shopeeAff01',
      isActive: true,
    },
  })
  const affiliate2 = await db.user.create({
    data: {
      id: 'user_aff02',
      email: 'wei@example.com',
      name: 'Wei Ming',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'affiliate',
      shopeeAffId: 'shopeeAff02',
      isActive: true,
    },
  })
  const viewerUser = await db.user.create({
    data: {
      id: 'user_view01',
      email: 'viewer@example.com',
      name: 'Raj Kumar',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'viewer',
      isActive: true,
    },
  })
  console.log(`✅ Created ${3} additional users`)

  // Create campaigns
  const campaigns = await db.campaign.createMany({
    data: [
      {
        id: 'camp_01',
        name: 'Ramadan Sale 2025',
        description: 'Special affiliate campaign for Ramadan mega sale period',
        status: 'active',
        budget: 5000,
        spent: 2340,
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-04-15'),
      },
      {
        id: 'camp_02',
        name: 'Tech Gadgets Promo',
        description: 'Electronics and gadgets affiliate push',
        status: 'active',
        budget: 3000,
        spent: 1200,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
      },
      {
        id: 'camp_03',
        name: 'Beauty & Skincare',
        description: 'Beauty product affiliate links for Q1 2025',
        status: 'paused',
        budget: 2000,
        spent: 1800,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
      },
      {
        id: 'camp_04',
        name: 'Back to School',
        description: 'School supplies and electronics for students',
        status: 'completed',
        budget: 1500,
        spent: 1500,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-01-31'),
      },
    ],
  })

  console.log(`✅ Created ${campaigns.count} campaigns`)

  // Create affiliate links
  const affiliateLinks = [
    {
      id: 'link_01',
      name: 'Wireless Earbuds Pro',
      productUrl: 'https://shopee.com.my/wireless-earbuds-pro',
      affiliateUrl: 'https://shopee.com.my/wireless-earbuds-pro?aff_id=shopeeAff01',
      productId: 'prod_1001',
      productName: 'Wireless Earbuds Pro - Active Noise Cancelling',
      productImage: '/products/tws-earbuds.png',
      productPrice: 89.90,
      commission: 8.99,
      category: 'Electronics',
      campaignId: 'camp_02',
      userId: 'user_aff01',
      clicks: 342,
      conversions: 28,
      earnings: 251.72,
      status: 'active' as const,
      shortCode: 'earbuds01',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // expires in 5 days
    },
    {
      id: 'link_02',
      name: 'Korean Skincare Set',
      productUrl: 'https://shopee.com.my/korean-skincare',
      affiliateUrl: 'https://shopee.com.my/korean-skincare?aff_id=shopeeAff02',
      productId: 'prod_1002',
      productName: 'Korean 10-Step Skincare Set - Complete Routine',
      productImage: '/products/innisfree-serum.png',
      productPrice: 149.90,
      commission: 14.99,
      category: 'Beauty',
      campaignId: 'camp_03',
      userId: 'user_aff01',
      clicks: 521,
      conversions: 42,
      earnings: 629.58,
      status: 'active' as const,
      shortCode: 'skincare02',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // expires in 3 days
    },
    {
      id: 'link_03',
      name: 'Smart Watch Ultra',
      productUrl: 'https://shopee.com.my/smart-watch',
      affiliateUrl: 'https://shopee.com.my/smart-watch?aff_id=shopeeAff03',
      productId: 'prod_1003',
      productName: 'Smart Watch Ultra - Fitness Tracker GPS',
      productImage: '/products/airpods-pro.png',
      productPrice: 299.90,
      commission: 29.99,
      category: 'Electronics',
      campaignId: 'camp_02',
      userId: 'user_aff02',
      clicks: 189,
      conversions: 15,
      earnings: 449.85,
      status: 'active' as const,
      shortCode: 'watch03',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // expires in 7 days
    },
    {
      id: 'link_04',
      name: 'Men Fashion Hoodie',
      productUrl: 'https://shopee.com.my/mens-hoodie',
      affiliateUrl: 'https://shopee.com.my/mens-hoodie?aff_id=shopeeAff04',
      productId: 'prod_1004',
      productName: 'Premium Cotton Hoodie - Unisex Streetwear',
      productImage: '/products/uniqlo-tshirt.png',
      productPrice: 59.90,
      commission: 5.99,
      category: 'Fashion',
      campaignId: 'camp_01',
      userId: 'user_aff01',
      clicks: 276,
      conversions: 34,
      earnings: 203.66,
      status: 'active' as const,
      shortCode: 'hoodie04',
      expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // expired 3 days ago
    },
    {
      id: 'link_05',
      name: 'LED Desk Lamp',
      productUrl: 'https://shopee.com.my/led-lamp',
      affiliateUrl: 'https://shopee.com.my/led-lamp?aff_id=shopeeAff05',
      productId: 'prod_1005',
      productName: 'LED Desk Lamp with Wireless Charger - Eye Care',
      productImage: '/products/cetaphil.png',
      productPrice: 79.90,
      commission: 7.99,
      category: 'Home & Living',
      clicks: 145,
      conversions: 11,
      earnings: 87.89,
      status: 'active' as const,
      shortCode: 'lamp05',
    },
    {
      id: 'link_06',
      name: 'Running Shoes Elite',
      productUrl: 'https://shopee.com.my/running-shoes',
      affiliateUrl: 'https://shopee.com.my/running-shoes?aff_id=shopeeAff06',
      productId: 'prod_1006',
      productName: 'Lightweight Running Shoes - Breathable Mesh',
      productImage: '/products/running-shoes.png',
      productPrice: 199.90,
      commission: 19.99,
      category: 'Fashion',
      campaignId: 'camp_01',
      userId: 'user_aff02',
      clicks: 412,
      conversions: 38,
      earnings: 759.62,
      status: 'active' as const,
      shortCode: 'shoes06',
      expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // expired 1 day ago
    },
    {
      id: 'link_07',
      name: 'Vitamin C Serum',
      productUrl: 'https://shopee.com.my/vitc-serum',
      affiliateUrl: 'https://shopee.com.my/vitc-serum?aff_id=shopeeAff07',
      productId: 'prod_1007',
      productName: 'Vitamin C Serum 20% - Brightening Anti-Aging',
      productImage: '/products/vitamin-c.png',
      productPrice: 39.90,
      commission: 3.99,
      category: 'Beauty',
      campaignId: 'camp_03',
      userId: 'user_aff01',
      clicks: 689,
      conversions: 56,
      earnings: 223.44,
      status: 'active' as const,
      shortCode: 'serum07',
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // expires in 2 days
    },
    {
      id: 'link_08',
      name: 'Portable Blender',
      productUrl: 'https://shopee.com.my/portable-blender',
      affiliateUrl: 'https://shopee.com.my/portable-blender?aff_id=shopeeAff08',
      productId: 'prod_1008',
      productName: 'USB Rechargeable Portable Blender - 400ml',
      productImage: '/products/snack-box.png',
      productPrice: 49.90,
      commission: 4.99,
      category: 'Home & Living',
      clicks: 234,
      conversions: 19,
      earnings: 94.81,
      status: 'active' as const,
      shortCode: 'blender08',
    },
    {
      id: 'link_09',
      name: 'Wireless Mouse RGB',
      productUrl: 'https://shopee.com.my/wireless-mouse',
      affiliateUrl: 'https://shopee.com.my/wireless-mouse?aff_id=shopeeAff09',
      productId: 'prod_1009',
      productName: 'Gaming Wireless Mouse - 16000 DPI RGB',
      productImage: '/products/tws-earbuds.png',
      productPrice: 69.90,
      commission: 6.99,
      category: 'Electronics',
      campaignId: 'camp_02',
      clicks: 178,
      conversions: 14,
      earnings: 97.86,
      status: 'paused' as const,
      shortCode: 'mouse09',
    },
    {
      id: 'link_10',
      name: 'Yoga Mat Premium',
      productUrl: 'https://shopee.com.my/yoga-mat',
      affiliateUrl: 'https://shopee.com.my/yoga-mat?aff_id=shopeeAff10',
      productId: 'prod_1010',
      productName: 'Premium Non-Slip Yoga Mat - 8mm Thick',
      productImage: '/products/vitamin-c.png',
      productPrice: 89.90,
      commission: 8.99,
      category: 'Health',
      clicks: 156,
      conversions: 12,
      earnings: 107.88,
      status: 'active' as const,
      shortCode: 'yoga10',
    },
    {
      id: 'link_11',
      name: 'Instant Noodle Bundle',
      productUrl: 'https://shopee.com.my/noodle-bundle',
      affiliateUrl: 'https://shopee.com.my/noodle-bundle?aff_id=shopeeAff11',
      productId: 'prod_1011',
      productName: 'Premium Instant Noodle Bundle - 30 Packs',
      productImage: '/products/snack-box.png',
      productPrice: 45.90,
      commission: 4.59,
      category: 'Food',
      clicks: 523,
      conversions: 67,
      earnings: 307.53,
      status: 'active' as const,
      shortCode: 'noodle11',
    },
    {
      id: 'link_12',
      name: 'Phone Case Designer',
      productUrl: 'https://shopee.com.my/phone-case',
      affiliateUrl: 'https://shopee.com.my/phone-case?aff_id=shopeeAff12',
      productId: 'prod_1012',
      productName: 'Designer Phone Case - Clear Matte Protection',
      productImage: '/products/airpods-pro.png',
      productPrice: 19.90,
      commission: 1.99,
      category: 'Electronics',
      clicks: 890,
      conversions: 112,
      earnings: 222.88,
      status: 'active' as const,
      shortCode: 'case12',
    },
    {
      id: 'link_13',
      name: 'Aromatherapy Diffuser',
      productUrl: 'https://shopee.com.my/aroma-diffuser',
      affiliateUrl: 'https://shopee.com.my/aroma-diffuser?aff_id=shopeeAff13',
      productId: 'prod_1013',
      productName: 'Ultrasonic Aromatherapy Diffuser - 500ml',
      productImage: '/products/laneige-mask.png',
      productPrice: 69.90,
      commission: 6.99,
      category: 'Home & Living',
      clicks: 198,
      conversions: 16,
      earnings: 111.84,
      status: 'active' as const,
      shortCode: 'diffuser13',
    },
    {
      id: 'link_14',
      name: 'Kids School Bag',
      productUrl: 'https://shopee.com.my/school-bag',
      affiliateUrl: 'https://shopee.com.my/school-bag?aff_id=shopeeAff14',
      productId: 'prod_1014',
      productName: 'Ergonomic Kids School Bag - Waterproof Large',
      productImage: '/products/uniqlo-tshirt.png',
      productPrice: 79.90,
      commission: 7.99,
      category: 'Fashion',
      campaignId: 'camp_04',
      clicks: 345,
      conversions: 29,
      earnings: 231.71,
      status: 'expired' as const,
      shortCode: 'bag14',
    },
    {
      id: 'link_15',
      name: 'Protein Powder',
      productUrl: 'https://shopee.com.my/protein',
      affiliateUrl: 'https://shopee.com.my/protein?aff_id=shopeeAff15',
      productId: 'prod_1015',
      productName: 'Whey Protein Powder - Chocolate 2.5kg',
      productImage: '/products/ensure-gold.png',
      productPrice: 159.90,
      commission: 15.99,
      category: 'Health',
      clicks: 267,
      conversions: 21,
      earnings: 335.79,
      status: 'active' as const,
      shortCode: 'protein15',
    },
    {
      id: 'link_16',
      name: 'USB-C Hub Adapter',
      productUrl: 'https://shopee.com.my/usbc-hub',
      affiliateUrl: 'https://shopee.com.my/usbc-hub?aff_id=shopeeAff16',
      productId: 'prod_1016',
      productName: '7-in-1 USB-C Hub Adapter - HDMI Ethernet',
      productImage: '/products/tws-earbuds.png',
      productPrice: 55.90,
      commission: 5.59,
      category: 'Electronics',
      campaignId: 'camp_02',
      clicks: 134,
      conversions: 9,
      earnings: 50.31,
      status: 'active' as const,
      shortCode: 'hub16',
    },
    {
      id: 'link_17',
      name: 'Matcha Powder Organic',
      productUrl: 'https://shopee.com.my/matcha',
      affiliateUrl: 'https://shopee.com.my/matcha?aff_id=shopeeAff17',
      productId: 'prod_1017',
      productName: 'Organic Japanese Matcha Powder - Ceremonial Grade 100g',
      productImage: '/products/innisfree-serum.png',
      productPrice: 68.00,
      commission: 6.80,
      category: 'Food',
      campaignId: 'camp_01',
      clicks: 410,
      conversions: 35,
      earnings: 238.00,
      status: 'active' as const,
      shortCode: 'matcha17',
    },
    {
      id: 'link_18',
      name: 'Mechanical Keyboard',
      productUrl: 'https://shopee.com.my/mech-keyboard',
      affiliateUrl: 'https://shopee.com.my/mech-keyboard?aff_id=shopeeAff18',
      productId: 'prod_1018',
      productName: 'RGB Mechanical Keyboard - Hot-Swappable Blue Switch',
      productImage: '/products/airpods-pro.png',
      productPrice: 189.90,
      commission: 18.99,
      category: 'Electronics',
      campaignId: 'camp_02',
      clicks: 203,
      conversions: 17,
      earnings: 322.83,
      status: 'active' as const,
      shortCode: 'kb18',
    },
  ]

  for (const link of affiliateLinks) {
    await db.affiliateLink.create({ data: link })
  }
  console.log(`✅ Created ${affiliateLinks.length} affiliate links`)

  // Create click records
  const countries = ['Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Philippines', 'Vietnam', 'Brunei']
  const devices = ['Mobile', 'Desktop', 'Tablet']
  const referers = ['google.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'direct', 'twitter.com', 'shopee.com.my', 'whatsapp.com']

  const clickRecords = []
  for (let i = 0; i < 60; i++) {
    const linkIdx = Math.floor(Math.random() * affiliateLinks.length)
    const link = affiliateLinks[linkIdx]
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

    clickRecords.push({
      linkId: link.id,
      userId: link.userId || null,
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      referer: referers[Math.floor(Math.random() * referers.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      converted: Math.random() > 0.7,
      createdAt: date,
    })
  }

  await db.clickRecord.createMany({ data: clickRecords })
  console.log(`✅ Created ${clickRecords.length} click records`)

  // Create conversions
  const conversionStatuses = ['pending', 'confirmed', 'confirmed', 'confirmed', 'paid', 'rejected'] as const
  const conversions = []
  for (let i = 0; i < 25; i++) {
    const linkIdx = Math.floor(Math.random() * affiliateLinks.length)
    const link = affiliateLinks[linkIdx]
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    const amount = Math.round((Math.random() * 300 + 20) * 100) / 100
    const commission = Math.round(amount * (Math.random() * 0.1 + 0.05) * 100) / 100

    conversions.push({
      linkId: link.id,
      orderId: `ORD${Date.now()}${i}`,
      amount,
      commission,
      status: conversionStatuses[Math.floor(Math.random() * conversionStatuses.length)],
      createdAt: date,
    })
  }

  await db.conversion.createMany({ data: conversions })
  console.log(`✅ Created ${conversions.length} conversions`)

  // Create payouts
  const payouts = [
    {
      id: 'pay_01',
      method: 'bank_transfer',
      amount: 500,
      status: 'completed' as const,
      bankName: 'Maybank',
      accountNo: 'XXXX-XXXX-8901',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-01-15'),
      processedAt: new Date('2025-01-20'),
      note: 'January payout',
    },
    {
      id: 'pay_02',
      method: 'bank_transfer',
      amount: 750,
      status: 'completed' as const,
      bankName: 'Maybank',
      accountNo: 'XXXX-XXXX-8901',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-02-15'),
      processedAt: new Date('2025-02-20'),
      note: 'February payout',
    },
    {
      id: 'pay_03',
      method: 'bank_transfer',
      amount: 1200,
      status: 'processing' as const,
      bankName: 'Maybank',
      accountNo: 'XXXX-XXXX-8901',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-03-15'),
      processedAt: new Date('2025-03-22'),
      note: 'March payout',
    },
    {
      id: 'pay_04',
      method: 'ewallet',
      amount: 300,
      status: 'pending' as const,
      bankName: 'Touch n Go',
      accountNo: 'XXXX-XXXX-6789',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-04-01'),
      note: 'Via TnG eWallet',
    },
    {
      id: 'pay_05',
      method: 'bank_transfer',
      amount: 850,
      status: 'pending' as const,
      bankName: 'CIMB',
      accountNo: 'XXXX-XXXX-3456',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-04-05'),
      note: 'April payout request',
    },
    {
      id: 'pay_06',
      method: 'ewallet',
      amount: 200,
      status: 'failed' as const,
      bankName: 'GrabPay',
      accountNo: 'XXXX-XXXX-5432',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-03-28'),
      processedAt: new Date('2025-03-29'),
      note: 'Insufficient balance in e-wallet',
    },
  ]

  await db.payout.createMany({ data: payouts })
  console.log(`✅ Created ${payouts.length} payouts`)

  // Create app settings
  const settings = [
    { key: 'api_key', value: 'PLACEHOLDER_SET_VIA_ENV' },
    { key: 'shopee_username', value: 'ahmad_affiliate' },
    { key: 'default_commission_rate', value: '10' },
    { key: 'notification_email', value: 'ahmad@example.com' },
    { key: 'currency', value: 'MYR' },
    { key: 'min_payout_amount', value: '100' },
    { key: 'webhook_url', value: 'https://example.com/webhook/shopee' },
    { key: 'email_notifications', value: 'true' },
  ]

  await db.appSetting.createMany({ data: settings })
  console.log(`✅ Created ${settings.length} app settings`)

  // Create earning goals
  const now = new Date()
  const earningGoals = [
    {
      id: 'goal_01',
      name: 'Monthly Target',
      targetAmount: 3000,
      currentAmount: 2847.50,
      period: 'monthly' as const,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      status: 'active' as const,
    },
    {
      id: 'goal_02',
      name: 'Ramadan Sale Bonus',
      targetAmount: 5000,
      currentAmount: 4200,
      period: 'custom' as const,
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-04-15'),
      status: 'active' as const,
    },
    {
      id: 'goal_03',
      name: 'Q2 Goal',
      targetAmount: 15000,
      currentAmount: 8750,
      period: 'yearly' as const,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-06-30'),
      status: 'active' as const,
    },
  ]

  for (const goal of earningGoals) {
    await db.earningGoal.create({ data: goal })
  }
  console.log(`✅ Created ${earningGoals.length} earning goals`)

  // Create notifications
  const notifications = [
    {
      id: 'notif_01',
      type: 'conversion',
      title: 'New Conversion!',
      description: 'Running Shoes Elite earned RM 16.86 commission from a completed order.',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
      id: 'notif_02',
      type: 'payout',
      title: 'Payout Processed',
      description: 'RM 1,200.00 has been transferred to your Maybank account ****4521.',
      read: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      id: 'notif_03',
      type: 'campaign',
      title: 'Campaign Ending Soon',
      description: 'Ramadan Sale 2025 campaign ends in 5 days. Boost your links now!',
      read: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: 'notif_04',
      type: 'conversion',
      title: 'Conversion on Korean Skincare Set',
      description: 'You earned RM 14.99 commission from a purchase via your affiliate link.',
      read: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: 'notif_05',
      type: 'system',
      title: 'New Feature: Analytics Dashboard',
      description: 'Check out the new analytics dashboard with detailed traffic insights.',
      read: true,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
    {
      id: 'notif_06',
      type: 'payout',
      title: 'Payout Request Received',
      description: 'Your payout request of RM 850.00 has been received and is being processed.',
      read: true,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      id: 'notif_07',
      type: 'alert',
      title: 'Link Performance Alert',
      description: 'Wireless Earbuds Pro link has a 40% drop in clicks this week.',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: 'notif_08',
      type: 'conversion',
      title: 'Conversion on Organic Face Serum',
      description: 'A new purchase generated RM 9.50 in commission.',
      read: true,
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    },
    {
      id: 'notif_09',
      type: 'campaign',
      title: 'New Campaign Available',
      description: 'Join the "Tech Gadgets Mega Sale" campaign and earn 2x commission.',
      read: true,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
    {
      id: 'notif_10',
      type: 'system',
      title: 'Commission Rate Updated',
      description: 'Your commission rate has been increased to 12% for Electronics category.',
      read: true,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    },
    {
      id: 'notif_11',
      type: 'alert',
      title: 'Expired Link Detected',
      description: '2 of your affiliate links have expired. Update them to keep earning.',
      read: true,
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
    },
    {
      id: 'notif_12',
      type: 'conversion',
      title: 'Conversion on Laptop Stand Pro',
      description: 'New order confirmed! You earned RM 22.40 commission.',
      read: true,
      createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
    },
    {
      id: 'notif_13',
      type: 'system',
      title: 'Weekly Performance Report',
      description: 'Your weekly affiliate report is ready. Total clicks: 2,450, conversions: 87.',
      read: true,
      createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000),
    },
  ]

  for (const notif of notifications) {
    await db.notification.create({ data: notif })
  }
  console.log(`✅ Created ${notifications.length} notifications`)

  // Create achievements
  const achievements = [
    {
      id: 'ach_01',
      userId: 'user_admin',
      type: 'first_sale',
      title: 'First Sale',
      description: 'Completed your very first affiliate sale!',
      icon: '🏆',
    },
    {
      id: 'ach_02',
      userId: 'user_admin',
      type: '100_clicks',
      title: '100 Clicks Milestone',
      description: 'Reached 100 total clicks on your affiliate links.',
      icon: '🔥',
    },
    {
      id: 'ach_03',
      userId: 'user_aff01',
      type: 'top_earner',
      title: 'Top Earner',
      description: 'Ranked as a top earner for the month.',
      icon: '💰',
    },
    {
      id: 'ach_04',
      userId: 'user_aff02',
      type: 'first_sale',
      title: 'First Sale',
      description: 'Completed your very first affiliate sale!',
      icon: '🏆',
    },
    {
      id: 'ach_05',
      userId: 'user_admin',
      type: 'streak_7',
      title: '7-Day Streak',
      description: 'Logged in 7 days in a row. Keep it up!',
      icon: '⚡',
    },
  ]

  for (const ach of achievements) {
    await db.achievement.create({ data: ach })
  }
  console.log(`✅ Created ${achievements.length} achievements`)

  // Create leaderboard entries
  const leaderboardEntries = [
    {
      id: 'lb_01',
      userId: 'user_admin',
      userName: 'Ahmad Ali',
      totalEarnings: 2847.50,
      totalClicks: 5234,
      totalConversions: 312,
      period: 'monthly',
      rank: 1,
    },
    {
      id: 'lb_02',
      userId: 'user_aff01',
      userName: 'Siti Nurhaliza',
      totalEarnings: 1653.02,
      totalClicks: 2987,
      totalConversions: 198,
      period: 'monthly',
      rank: 2,
    },
    {
      id: 'lb_03',
      userId: 'user_aff02',
      userName: 'Wei Ming',
      totalEarnings: 1209.47,
      totalClicks: 1845,
      totalConversions: 134,
      period: 'monthly',
      rank: 3,
    },
  ]

  for (const entry of leaderboardEntries) {
    await db.leaderboardEntry.create({ data: entry })
  }
  console.log(`✅ Created ${leaderboardEntries.length} leaderboard entries`)

  console.log('🎉 Database seeded successfully!')
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
