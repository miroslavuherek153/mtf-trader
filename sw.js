// MTF Trader — Service Worker
// index.html: network-first (vždy nejnovější verze, cache jen jako offline fallback)
// CDN knihovny (Chart.js, jsPDF, ikony): cache-first — jsou verzované, offline musí fungovat
// Ostatní statické soubory (manifest, ikony appky): cache-first
// api.twelvedata.com: vždy síť, nikdy se necachuje (živá tržní data)

const CACHE_NAME = 'mtf-trader-v3';

const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Verzované CDN knihovny — bezpečné cachovat natvrdo, protože URL obsahuje číslo verze.
// Pokud v index.html změníš verzi knihovny, uprav ji i tady a bump CACHE_NAME.
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(STATIC_ASSETS);
      // CDN assety cachujeme best-effort — pokud jeden selže (např. instalace offline),
      // nesmí to shodit celou instalaci service workeru.
      await Promise.allSettled(CDN_ASSETS.map((u) => cache.add(u)));
    })
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

  // Ignoruj požadavky, které nejsou http/https (např. chrome-extension://) — Cache API je neumí uložit
  if (!url.startsWith('http')) return;

  const isApi = url.includes('api.twelvedata.com');
  const isCdn = url.includes('cdnjs.cloudflare.com') || url.includes('cdn.jsdelivr.net');

  // Živá tržní data — vždy síť, nikdy se necachují. Offline vrátíme srozumitelnou JSON chybu
  // místo syrové síťové výjimky, ať to appka umí hezky zalogovat.
  if (isApi) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ status: 'error', message: 'Offline — není připojení k internetu.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // CDN knihovny (Chart.js, jsPDF, ikonový font) — cache-first, na pozadí tichý refresh.
  // Tohle je oprava: dřív se tyto soubory nikdy neuložily do cache, takže appka bez
  // internetu neuměla vykreslit equity graf ani exportovat PDF.
  if (isCdn) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // HTML / navigace — network-first, aby se nové nahrání na GitHub vždy projevilo
  if (event.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match(event.request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Ostatní statické soubory appky (ikony, manifest) — cache-first.
  // Oprava: dřív se při chybě fetch fallbackovalo na index.html i pro tyhle požadavky,
  // takže by např. chybějící ikona offline vrátila HTML stránku místo obrázku.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
