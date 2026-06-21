// MTF Trader — Service Worker
// index.html: network-first (vždy nejnovější verze, cache jen jako offline fallback)
// Ostatní statické soubory: cache-first
// API/CDN volání: vždy síť

const CACHE_NAME = 'mtf-trader-v2';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // API a CDN požadavky — vždy síť, fallback na cache jen offline
  if (url.includes('api.twelvedata.com') || url.includes('cdnjs.cloudflare.com') || url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // HTML / navigace — network-first, aby se nové nahrání na GitHub vždy projevilo
  if (event.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Ostatní statické soubory (ikony, manifest) — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(() => caches.match('./index.html'))
  );
});
