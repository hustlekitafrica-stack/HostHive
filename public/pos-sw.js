// Kogelo POS — Service Worker
// Strategy: cache-first for static shell, network-first for API calls.

const CACHE_NAME = 'kogelo-pos-v1';

// App shell pages to pre-cache on install
const SHELL_URLS = [
  '/pos',
  '/pos/terminal',
  '/pos/tables',
  '/pos/kitchen',
  '/pos/close-shift',
  '/pos/stock',
  '/pos/stock/bar',
  '/pos-manifest.json',
];

// ── Install: pre-cache the shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add shell pages to cache — ignore individual failures
      return Promise.allSettled(
        SHELL_URLS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  // Take effect immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always use network for API calls — never serve stale data from POS
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for navigation requests (always get fresh HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Update the cache with the fresh response
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => {
          // Offline fallback: serve cached version
          return caches.match(request).then(
            (cached) => cached || caches.match('/pos')
          );
        })
    );
    return;
  }

  // Cache-first for static assets (_next/static, icons, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/screenshots/')
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
