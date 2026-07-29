const CACHE_VERSION = 'v2'
const ROOT_CACHE = `exora-root-${CACHE_VERSION}`
const TOKO_CACHE = `exora-toko-${CACHE_VERSION}`

const ROOT_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Deteksi apakah request ini storefront toko
function isTokoRoute(url) {
  const path = url.pathname
  // Exclude semua route internal
  const excluded = ['/', '/login', '/dashboard', '/admin', '/api']
  if (excluded.some(r => path === r || path.startsWith(r + '/'))) return false
  // Exclude static assets
  if (path.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|json)$/)) return false
  // Sisanya adalah /:slug
  return path.split('/').filter(Boolean).length === 1
}

// Simpan ke cache HANYA kalau response sukses (hindari cache poisoning dari error)
function cachePutIfOk(cacheName, request, response) {
  if (response && response.ok) {
    const clone = response.clone()
    caches.open(cacheName).then((cache) => cache.put(request, clone))
  }
  return response
}

// Install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(ROOT_CACHE).then((cache) => cache.addAll(ROOT_ASSETS))
  )
  self.skipWaiting()
})

// Activate — bersihkan cache lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== ROOT_CACHE && k !== TOKO_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return

  // Manifest per toko — network only, jangan di-cache
  if (url.pathname === '/api/manifest') {
    return
  }

  if (isTokoRoute(url)) {
    // Toko: network first, fallback cache — hanya cache response sukses
    e.respondWith(
      fetch(e.request)
        .then((res) => cachePutIfOk(TOKO_CACHE, e.request, res))
        .catch(() => caches.match(e.request))
    )
  } else {
    // Root: network first, fallback cache — hanya cache response sukses
    e.respondWith(
      fetch(e.request)
        .then((res) => cachePutIfOk(ROOT_CACHE, e.request, res))
        .catch(() => caches.match(e.request))
    )
  }
})

// Message — force update dari app
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})
