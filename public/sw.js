/**
 * Defimart Service Worker - V3
 * Handles intelligent caching of assets, pages, and images for a seamless offline experience.
 */

const CACHE_NAME = 'defimart-cache-v3';
const IMAGE_CACHE = 'defimart-images-v1';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/screenshots/screenshot1.png',
  '/screenshots/screenshot2.png',
  '/screenshots/screenshot-wide.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// 1. Install - Pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 2. Activate - Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== IMAGE_CACHE).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch - Handle different resource types
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass for Supabase critical auth and non-GET requests
  if (url.origin.includes('supabase.co') && url.pathname.includes('/auth/v1')) {
    return;
  }

  // Strategy for Images: Cache-First
  // We cache images from common sources used in the app
  const isImage = event.request.destination === 'image' || 
                 url.hostname.includes('picsum.photos') || 
                 url.hostname.includes('unsplash.com') ||
                 url.hostname.includes('supabase.co');

  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // If network fails for image, just return undefined (browser shows broken image)
            return null;
          });
        });
      })
    );
    return;
  }

  // Strategy for Navigation: Network-First with Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline');
          });
        })
    );
    return;
  }

  // Strategy for everything else: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
