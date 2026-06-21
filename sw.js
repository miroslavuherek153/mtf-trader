// MTF Trader — Service Worker
// Cache-first pro statické soubory, network-first pro API volání

const CACHE_NAME = 'mtf-trader-v1';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalace — uloží statické soubory do cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Aktivace — smaže staré verze cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — API volání (Twelve Data, CDN) jdou vždy na síť,
// statické soubory aplikace se servírují z cache s fallbackem na síť
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // API a CDN požadavky — vždy network-first (živá data)
  if (url.includes('api.twelvedata.com') || url.includes('cdnjs.cloudflare.com') || url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Statické soubory aplikace — cache-first
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
