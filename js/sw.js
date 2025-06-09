/**
 * Service Worker for CakeWalk Baking Co.
 * Provides offline support and caching
 */

const CACHE_NAME = 'cakewalk-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/mobile.css',
  '/css/desktop.css',
  '/css/modal.css',
  '/css/optimized/responsive.css',
  '/js/app.js',
  '/js/core/utils.js',
  '/js/core/events.js',
  '/js/components/Navigation.js',
  '/js/components/Carousel3D.js',
  '/js/components/Modal.js',
  '/js/components/Form.js',
  '/img/logo.png',
  '/img/bakery.jpg',
  '/img/img1.png',
  '/img/img2.png',
  '/img/img3.png',
  '/img/img4.png',
  '/img/img5.png',
  '/img/img6.png'
];

// Install event - precache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_ASSETS).catch(err => {
          console.error('Precaching failed:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              // Only cache same-origin requests
              if (event.request.url.startsWith(self.location.origin)) {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(error => {
          // Network failed, try to serve offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          console.error('Fetch failed:', error);
          throw error;
        });
      })
  );
});