import { createServer } from 'http'
import { Server } from 'socket.io'
import { randomUUID, randomInt } from 'crypto'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// --- Mock notification data generators ---
// WARNING: These are ONLY for demo mode and should NEVER run in production

const PRODUCT_NAMES = [
  'Wireless TWS Earbuds',
  'Laneige Water Sleeping Mask',
  'Cetaphil Gentle Skin Cleanser',
  'Running Shoes Pro',
  'Vitamin C Serum 1000mg',
  'AirPods Pro 2nd Gen',
  'Ensure Gold Powder',
  'Korean Snack Box',
  'Uniqlo Dry-Ex T-Shirt',
  'Innisfree Green Tea Serum',
]

const CLICK_SOURCES = [
  'Instagram Story',
  'TikTok Video',
  'Facebook Post',
  'WhatsApp Share',
  'Blog Article',
  'YouTube Description',
]

type NotificationType = 'conversion' | 'click' | 'payout' | 'milestone'

interface MockNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  amount?: number
  productName?: string
  timestamp: string
}

/**
 * Generate notification ID using cryptographically secure randomUUID
 * Never use Math.random() for IDs
 */
function generateId(): string {
  return `notif_${Date.now()}_${randomUUID()}`
}

/**
 * Check if demo mode is enabled
 * Demo mode should only be enabled in non-production environments
 */
function isDemoMode(): boolean {
  // Strict check: only allow demo mode if explicitly enabled
  if (process.env.DEMO_MODE !== 'true') {
    return false
  }

  // Additional safety: never allow demo mode in production
  if (process.env.NODE_ENV === 'production') {
    console.error('[SECURITY] Demo mode is disabled in production environment')
    return false
  }

  // Check for Vercel production
  if (process.env.VERCEL_ENV === 'production') {
    console.error('[SECURITY] Demo mode is disabled in Vercel production')
    return false
  }

  return true
}

/**
 * Pick a random item from array using crypto.randomInt
 * Only for demo mode mock data generation
 */
function randomPick<T>(arr: T[]): T {
  const index = randomInt(0, arr.length)
  return arr[index]
}

/**
 * Generate random number between min and max using crypto.randomInt
 * Only for demo mode mock data generation
 */
function randomBetween(min: number, max: number): number {
  const integer = randomInt(min, max + 1)
  // Add decimal portion for realism
  const decimals = randomInt(0, 100) / 100
  return Math.round((integer + decimals) * 100) / 100
}

/**
 * Generate mock notification for demo purposes
 * This function ONLY runs when DEMO_MODE=true
 */
function generateMockNotification(): MockNotification {
  const type = randomPick<NotificationType>(['conversion', 'click', 'payout', 'milestone'])
  const timestamp = new Date().toISOString()

  switch (type) {
    case 'conversion': {
      const product = randomPick(PRODUCT_NAMES)
      const amount = randomBetween(5, 150)
      const commission = randomBetween(0.5, 15)
      return {
        id: generateId(),
        type: 'conversion',
        title: 'New Conversion!',
        message: `Someone purchased "${product}" via your link — you earned ₱${commission.toFixed(2)} commission.`,
        amount: commission,
        productName: product,
        timestamp,
      }
    }
    case 'click': {
      const product = randomPick(PRODUCT_NAMES)
      const source = randomPick(CLICK_SOURCES)
      return {
        id: generateId(),
        type: 'click',
        title: 'Link Click',
        message: `Your affiliate link for "${product}" was clicked from ${source}.`,
        productName: product,
        timestamp,
      }
    }
    case 'payout': {
      const amount = randomBetween(200, 5000)
      return {
        id: generateId(),
        type: 'payout',
        title: 'Payout Received',
        message: `₱${amount.toFixed(2)} has been credited to your Shopee Pay wallet.`,
        amount,
        timestamp,
      }
    }
    case 'milestone': {
      const milestones = [
        { title: '100 Conversions!', message: 'Congratulations! You have reached 100 total conversions this month.' },
        { title: '₱10,000 Earned!', message: 'You have earned over ₱10,000 in commissions this month. Keep going!' },
        { title: '500 Clicks Today!', message: 'Your links generated over 500 clicks today. Great traffic!' },
        { title: 'Top 10% Affiliate!', message: 'You are now in the top 10% of Shopee affiliates this week.' },
      ]
      const milestone = randomPick(milestones)
      return {
        id: generateId(),
        type: 'milestone',
        title: milestone.title,
        message: milestone.message,
        timestamp,
      }
    }
  }
}

// --- Socket.IO connection handling ---

io.on('connection', (socket) => {
  console.log(`[Notification] Client connected: ${socket.id}`)

  // Send initial connected event
  socket.emit('connected', {
    message: 'Connected to Shopee Affiliate notification service',
    timestamp: new Date().toISOString(),
  })

  socket.on('disconnect', (reason) => {
    console.log(`[Notification] Client disconnected: ${socket.id} (${reason})`)
  })

  socket.on('error', (error) => {
    console.error(`[Notification] Socket error (${socket.id}):`, error)
  })
})

// --- Periodic mock notification broadcast ---
// ONLY runs in demo mode - never in production

function scheduleNextNotification() {
  // Security check: only run in demo mode
  if (!isDemoMode()) {
    console.log('[Notification] Demo mode is disabled. Mock notifications will not be broadcast.')
    return
  }

  // Use crypto.randomInt for secure random delay calculation
  const delay = randomInt(15000, 30001) // 15-30 seconds

  setTimeout(() => {
    const notification = generateMockNotification()
    console.log(`[Notification] Broadcasting: [${notification.type}] ${notification.title}`)
    io.emit('notification', notification)
    scheduleNextNotification()
  }, delay)
}

const PORT = 3004
httpServer.listen(PORT, () => {
  console.log(`[Notification] WebSocket notification server running on port ${PORT}`)

  // Only start mock notifications in demo mode
  if (isDemoMode()) {
    console.log('[Notification] Demo mode is enabled. Starting mock notification broadcasts.')
    scheduleNextNotification()
  } else {
    console.log('[Notification] Demo mode is disabled. Mock notifications are disabled.')
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Notification] Received SIGTERM, shutting down...')
  httpServer.close(() => {
    console.log('[Notification] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Notification] Received SIGINT, shutting down...')
  httpServer.close(() => {
    console.log('[Notification] Server closed')
    process.exit(0)
  })
})
