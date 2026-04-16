/* eslint-disable no-console */
import { Prisma, PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user first (required for all seed data)
  const adminUser = await db.user.upsert({
    where: { email: 'admin@theviralfinds.my' },
    update: {},
    create: {
      email: 'admin@theviralfinds.my',
      name: 'Ahmad Ali',
      role: 'ADMIN',
    },
  })
  console.log(`✅ Created admin user: ${adminUser.id}`)

  const userId = adminUser.id

  // Clean existing data
  await db.clickRecord.deleteMany()
  await db.conversion.deleteMany()
  await db.payout.deleteMany()
  await db.affiliateLink.deleteMany()
  await db.campaign.deleteMany()
  await db.appSetting.deleteMany()
  await db.earningGoal.deleteMany()
  await db.notification.deleteMany()

  // Create campaigns
  const campaignData: Prisma.CampaignCreateManyInput[] = [
    {
      id: 'camp_01',
      userId,
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
      userId,
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
      userId,
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
      userId,
      name: 'Back to School',
      description: 'School supplies and electronics for students',
      status: 'completed',
      budget: 1500,
      spent: 1500,
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-01-31'),
    },
  ]

  const campaigns = await db.campaign.createMany({
    data: campaignData,
  })

  console.log(`✅ Created ${campaigns.count} campaigns`)

  // Create affiliate links
  const affiliateLinks: Prisma.AffiliateLinkUncheckedCreateInput[] = [
    {
      id: 'link_01',
      userId,
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
      clicks: 342,
      conversions: 28,
      earnings: 251.72,
      status: 'active',
      shortCode: 'earbuds01',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // expires in 5 days
    },
    {
      id: 'link_02',
      userId,
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
      clicks: 521,
      conversions: 42,
      earnings: 629.58,
      status: 'active',
      shortCode: 'skincare02',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // expires in 3 days
    },
    {
      id: 'link_03',
      userId,
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
      clicks: 189,
      conversions: 15,
      earnings: 449.85,
      status: 'active',
      shortCode: 'watch03',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // expires in 7 days
    },
    {
      id: 'link_04',
      userId,
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
      clicks: 276,
      conversions: 34,
      earnings: 203.66,
      status: 'active',
      shortCode: 'hoodie04',
      expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // expired 3 days ago
    },
    {
      id: 'link_05',
      userId,
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
      status: 'active',
      shortCode: 'lamp05',
    },
    {
      id: 'link_06',
      userId,
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
      clicks: 412,
      conversions: 38,
      earnings: 759.62,
      status: 'active',
      shortCode: 'shoes06',
      expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // expired 1 day ago
    },
    {
      id: 'link_07',
      userId,
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
      clicks: 689,
      conversions: 56,
      earnings: 223.44,
      status: 'active',
      shortCode: 'serum07',
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // expires in 2 days
    },
    {
      id: 'link_08',
      userId,
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
      status: 'active',
      shortCode: 'blender08',
    },
    {
      id: 'link_09',
      userId,
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
      status: 'paused',
      shortCode: 'mouse09',
    },
    {
      id: 'link_10',
      userId,
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
      status: 'active',
      shortCode: 'yoga10',
    },
    {
      id: 'link_11',
      userId,
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
      status: 'active',
      shortCode: 'noodle11',
    },
    {
      id: 'link_12',
      userId,
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
      status: 'active',
      shortCode: 'case12',
    },
    {
      id: 'link_13',
      userId,
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
      status: 'active',
      shortCode: 'diffuser13',
    },
    {
      id: 'link_14',
      userId,
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
      status: 'expired',
      shortCode: 'bag14',
    },
    {
      id: 'link_15',
      userId,
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
      status: 'active',
      shortCode: 'protein15',
    },
    {
      id: 'link_16',
      userId,
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
      status: 'active',
      shortCode: 'hub16',
    },
    {
      id: 'link_17',
      userId,
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
      status: 'active',
      shortCode: 'matcha17',
    },
    {
      id: 'link_18',
      userId,
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
      status: 'active',
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

  const clickRecords: Prisma.ClickRecordCreateManyInput[] = []
  for (let i = 0; i < 60; i++) {
    const linkIdx = Math.floor(Math.random() * affiliateLinks.length)
    const link = affiliateLinks[linkIdx]
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

    clickRecords.push({
      linkId: link.id,
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
  const conversionStatuses = ['pending', 'confirmed', 'confirmed', 'confirmed', 'paid', 'rejected']
  const conversions: Prisma.ConversionCreateManyInput[] = []
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
  const payouts: Prisma.PayoutCreateManyInput[] = [
    {
      id: 'pay_01',
      userId,
      method: 'bank_transfer',
      amount: 500,
      status: 'completed',
      bankName: 'Maybank',
      accountNo: '1142****8901',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-01-15'),
      processedAt: new Date('2025-01-20'),
      note: 'January payout',
    },
    {
      id: 'pay_02',
      userId,
      method: 'bank_transfer',
      amount: 750,
      status: 'completed',
      bankName: 'Maybank',
      accountNo: '1142****8901',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-02-15'),
      processedAt: new Date('2025-02-20'),
      note: 'February payout',
    },
    {
      id: 'pay_03',
      userId,
      method: 'bank_transfer',
      amount: 1200,
      status: 'processing',
      bankName: 'Maybank',
      accountNo: '1142****8901',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-03-15'),
      processedAt: new Date('2025-03-22'),
      note: 'March payout',
    },
    {
      id: 'pay_04',
      userId,
      method: 'ewallet',
      amount: 300,
      status: 'pending',
      bankName: 'Touch n Go',
      accountNo: '0123456789',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-04-01'),
      note: 'Via TnG eWallet',
    },
    {
      id: 'pay_05',
      userId,
      method: 'bank_transfer',
      amount: 850,
      status: 'pending',
      bankName: 'CIMB',
      accountNo: '7621****3456',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-04-05'),
      note: 'April payout request',
    },
    {
      id: 'pay_06',
      userId,
      method: 'ewallet',
      amount: 200,
      status: 'failed',
      bankName: 'GrabPay',
      accountNo: '0198765432',
      accountName: 'Ahmad bin Ali',
      requestedAt: new Date('2025-03-28'),
      processedAt: new Date('2025-03-29'),
      note: 'Insufficient balance in e-wallet',
    },
  ]

  await db.payout.createMany({ data: payouts })
  console.log(`✅ Created ${payouts.length} payouts`)

  // Create app settings
  const settings: Prisma.AppSettingCreateManyInput[] = [
    { userId, key: 'api_key', value: 'shopee_aff_abc123def456ghi789jkl' },
    { userId, key: 'shopee_username', value: 'ahmad_affiliate' },
    { userId, key: 'default_commission_rate', value: '10' },
    { userId, key: 'notification_email', value: 'ahmad@example.com' },
    { userId, key: 'currency', value: 'MYR' },
    { userId, key: 'min_payout_amount', value: '100' },
    { userId, key: 'webhook_url', value: 'https://example.com/webhook/shopee' },
    { userId, key: 'email_notifications', value: 'true' },
  ]

  await db.appSetting.createMany({ data: settings })
  console.log(`✅ Created ${settings.length} app settings`)

  // Create earning goals
  const now = new Date()
  const earningGoals: Prisma.EarningGoalUncheckedCreateInput[] = [
    {
      id: 'goal_01',
      userId,
      name: 'Monthly Target',
      targetAmount: 3000,
      currentAmount: 2847.50,
      period: 'monthly',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      status: 'active',
    },
    {
      id: 'goal_02',
      userId,
      name: 'Ramadan Sale Bonus',
      targetAmount: 5000,
      currentAmount: 4200,
      period: 'custom',
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-04-15'),
      status: 'active',
    },
    {
      id: 'goal_03',
      userId,
      name: 'Q2 Goal',
      targetAmount: 15000,
      currentAmount: 8750,
      period: 'yearly',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-06-30'),
      status: 'active',
    },
  ]

  for (const goal of earningGoals) {
    await db.earningGoal.create({ data: goal })
  }
  console.log(`✅ Created ${earningGoals.length} earning goals`)

  // Create notifications
  const notifications: Prisma.NotificationUncheckedCreateInput[] = [
    {
      id: 'notif_01',
      userId,
      type: 'conversion',
      title: 'New Conversion!',
      description: 'Running Shoes Elite earned RM 16.86 commission from a completed order.',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
      id: 'notif_02',
      userId,
      type: 'payout',
      title: 'Payout Processed',
      description: 'RM 1,200.00 has been transferred to your Maybank account ****4521.',
      read: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      id: 'notif_03',
      userId,
      type: 'campaign',
      title: 'Campaign Ending Soon',
      description: 'Ramadan Sale 2025 campaign ends in 5 days. Boost your links now!',
      read: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: 'notif_04',
      userId,
      type: 'conversion',
      title: 'Conversion on Korean Skincare Set',
      description: 'You earned RM 14.99 commission from a purchase via your affiliate link.',
      read: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: 'notif_05',
      userId,
      type: 'system',
      title: 'New Feature: Analytics Dashboard',
      description: 'Check out the new analytics dashboard with detailed traffic insights.',
      read: true,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
    {
      id: 'notif_06',
      userId,
      type: 'payout',
      title: 'Payout Request Received',
      description: 'Your payout request of RM 850.00 has been received and is being processed.',
      read: true,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      id: 'notif_07',
      userId,
      type: 'alert',
      title: 'Link Performance Alert',
      description: 'Wireless Earbuds Pro link has a 40% drop in clicks this week.',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: 'notif_08',
      userId,
      type: 'conversion',
      title: 'Conversion on Organic Face Serum',
      description: 'A new purchase generated RM 9.50 in commission.',
      read: true,
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    },
    {
      id: 'notif_09',
      userId,
      type: 'campaign',
      title: 'New Campaign Available',
      description: 'Join the "Tech Gadgets Mega Sale" campaign and earn 2x commission.',
      read: true,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
    {
      id: 'notif_10',
      userId,
      type: 'system',
      title: 'Commission Rate Updated',
      description: 'Your commission rate has been increased to 12% for Electronics category.',
      read: true,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    },
    {
      id: 'notif_11',
      userId,
      type: 'alert',
      title: 'Expired Link Detected',
      description: '2 of your affiliate links have expired. Update them to keep earning.',
      read: true,
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
    },
    {
      id: 'notif_12',
      userId,
      type: 'conversion',
      title: 'Conversion on Laptop Stand Pro',
      description: 'New order confirmed! You earned RM 22.40 commission.',
      read: true,
      createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
    },
    {
      id: 'notif_13',
      userId,
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
