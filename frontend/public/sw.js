const CACHE_NAME = 'awinja-school-v2'; // CHANGED to v2 to force update

// Only cache these specific files - NO API calls
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/media/favicon-logo.png',
  '/manifest.json'
];

// Install event - cache essential files only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache v2 - UPDATED VERSION');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - DO NOT CACHE API CALLS
self.addEventListener('fetch', (event) => {
  // DON'T cache API calls - always get fresh data
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For non-API requests, try network first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets only
        if (response.status === 200 && 
            (event.request.url.includes('/static/') || 
             event.request.url.includes('/media/'))) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache for static assets only
        return caches.match(event.request);
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