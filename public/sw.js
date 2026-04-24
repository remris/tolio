const CACHE_NAME = 'tolio-v3'
const API_CACHE = 'tolio-api-v1'
const STATIC_ASSETS = ['/company-login', '/pwa/scan', '/pwa/dashboard', '/pwa/assets']

// API routes to cache (GET only, stale-while-revalidate)
const CACHEABLE_API = ['/api/assets', '/api/auth/me']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Stale-while-revalidate for cacheable API GET requests
  if (event.request.method === 'GET' && CACHEABLE_API.some(p => url.pathname.startsWith(p))) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        const fetchPromise = fetch(event.request).then((res) => {
          if (res.ok) cache.put(event.request, res.clone())
          return res
        }).catch(() => null)

        return cached ?? (await fetchPromise) ?? new Response('{"error":"offline"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      })
    )
    return
  }

  // Skip non-GET and other API routes
  if (url.pathname.startsWith('/api/')) return
  if (event.request.method !== 'GET') return

  // Network first for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(r => r ?? caches.match('/pwa/dashboard'))
      )
    )
    return
  }

  // Cache first for static assets (_next/static, images, etc.)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      }).catch(() => cached ?? new Response('Offline', { status: 503 }))
    })
  )
})

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'tolio-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach(client => client.postMessage({ type: 'TRIGGER_SYNC' }))
      })
    )
  }
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload = { title: 'tolio', body: '', url: '/pwa/dashboard' }
  try { payload = { ...payload, ...event.data.json() } } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/pwa/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})

