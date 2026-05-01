const CACHE_NAME = 'defimart-v1';
const DATA_CACHE_NAME = 'defimart-data-v1';

const assetsToCache = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/screenshots/screenshot1.png',
  '/screenshots/screenshot2.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Supabase auth/api calls from caching to avoid errors
  if (event.request.method !== 'GET' || event.request.url.includes('/auth/v1/') || event.request.url.includes('/rest/v1/')) {
    return;
  }

  // Handle HTML navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline');
      })
    );
    return;
  }

  // Stale-While-Revalidate for other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache the new response
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
      return response || fetchPromise;
    })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // This is a placeholder for the browser-level Sync API
  // Real logic is handled in src/lib/offline-sync.ts for better framework integration
  console.log('Background sync triggered');
}
