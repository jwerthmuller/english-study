// sw.js — robust offline-friendly service worker

// Increment this version whenever you update core assets
const CACHE_NAME = 'english-study-v2';
const urlsToCache = [
  './',                // homepage
  './index.html',
  './app.js',
  './style.css',
  './sw.js',
  './data/unit_1.json',
  // Add any default audio files here if needed
  // './audio/hello.mp3',
];

// ============================
// Install: cache core assets
// ============================
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker and caching core assets...');
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
    ).then(() => self.clients.claim()) // Take control of all pages
  );
});

// ============================
// Fetch: cache-first with network update
// ============================
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Start network fetch in parallel to update cache
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // Only update cache if we got a valid response
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed (offline), fallback to cachedResponse
          return cachedResponse;
        });

      // Return cached response immediately if available, else wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
