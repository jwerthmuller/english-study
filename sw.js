// ============================================
// SERVICE WORKER - OFFLINE CACHING
// ============================================

const CACHE_NAME = 'english-study-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/sw.js',
  '/data/vocabulary.json',
  // Add any default audio files you want pre-cached
  // '/audio/hello.mp3',
  // '/audio/goodbye.mp3',
  // '/audio/good_morning.mp3',
  // '/audio/apple.mp3',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching core assets...');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Clone the response before caching (stream can only be read once)
            const responseToCache = networkResponse.clone();

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Fallback for offline mode - return a basic offline page if available
            if (event.request.url.includes('.mp3')) {
              // Return a placeholder audio or silence for missing audio
              return new Response('', { status: 404 });
            }
            // For other resources, try to return a basic offline page
            return caches.match('/index.html');
          });
      })
  );
});

// Optional: Listen for push notifications or background sync if you add those features later
// self.addEventListener('push', (event) => { /* ... */ });
// self.addEventListener('sync', (event) => { /* ... */ });