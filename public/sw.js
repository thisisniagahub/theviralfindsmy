const CACHE_NAME = 'theviralfinds-v1'
const STATIC_CACHE = 'theviralfinds-static-v1'
const API_CACHE = 'theviralfinds-api-v1'

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
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

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip Chrome extension requests and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // API routes: network first, fallback to cache
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request).then(r => r || fetch(event.request)))
    )
    return
  }

  // Static assets: cache first
  if (['style', 'script', 'image', 'font'].includes(event.request.destination)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response && response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Pages: network first, fallback to cache then offline page
  event.respondWith(
    fetch(event.request)
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match('/offline').then(offline => offline || new Response('Offline', { status: 503 }))
        )
      )
  )
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.openWindow(event.notification.data || '/')
  )
})
