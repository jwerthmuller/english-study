// sw.js — robust, dynamic caching for GitHub Pages

// Increment this whenever you update core assets
const CACHE_NAME = 'english-study-v1';
const urlsToCache = [
  './',                // homepage
  './index.html',
  './app.js',
  './style.css',
  './sw.js',
];

// ============================
// Install: cache core assets
// ============================
self.addEventListener('install', event => {
  console.log('[SW] Installing and caching core assets...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ============================
// Activate: clean up old caches
// ============================
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ============================
// Fetch: cache-first with dynamic caching
// ============================
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Try network in parallel to update cache dynamically
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const url = event.request.url;

            // Only dynamically cache JSON files under /data/ or audio files under /audio/
            if (url.includes('/data/') || url.includes('/audio/')) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
                console.log('[SW] Cached dynamically:', url);
              });
            }
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // Offline fallback

      // Return cached response immediately if available, else wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
