import { createServer } from 'http'
import { Server } from 'socket.io'
import { randomUUID } from 'crypto'

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

function generateId(): string {
  return `notif_${Date.now()}_${randomUUID().slice(0, 7)}`
}

function randomPick<T>(arr: T[]): T {
  const index = Math.floor(Math.random() * arr.length)
  return arr[index]
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

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

function scheduleNextNotification() {
  const randomBytes = new Uint8Array(4)
  crypto.getRandomValues(randomBytes)
  const randomValue = (randomBytes[0] << 24 | randomBytes[1] << 16 | randomBytes[2] << 8 | randomBytes[3]) >>> 0
  const delay = (randomValue % 15000) + 15000 // 15-30 seconds
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
  scheduleNextNotification()
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
