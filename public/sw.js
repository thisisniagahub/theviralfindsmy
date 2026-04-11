/**
 * Service Worker for PWA
 * Caches static assets and API responses for offline support.
 */

const CACHE_NAME = 'theviralfinds-v1'
const STATIC_CACHE = 'theviralfinds-static-v1'
const API_CACHE = 'theviralfinds-api-v1'

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// API routes to cache (stale-while-revalidate)
const API_CACHE_PATTERNS = [
  '/api/dashboard',
  '/api/links',
  '/api/analytics',
  '/api/goals',
  '/api/leaderboard',
  '/api/achievements',
]

// Install: cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== STATIC_CACHE && key !== API_CACHE)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url)

  // API routes: network first, fallback to cache
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Static assets: cache first
  if (event.request.destination === 'style' ||
      event.request.destination === 'script' ||
      event.request.destination === 'image' ||
      event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    )
    return
  }

  // Pages: network first, fallback to offline page
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match('/offline'))
  )
})

// Push notification handler
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'TheViralFinds', {
      body: data.message || 'You have a new notification',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'default',
      data: data.url || '/',
    })
  )
})

// Notification click: open the app
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients.openWindow(event.notification.data || '/')
  )
})

export {}
