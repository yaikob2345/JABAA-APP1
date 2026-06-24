// ============================================
// BARADHU SERVICE WORKER
// ============================================

const CACHE_NAME = 'baradhu-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/developer.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/data/loader.js',
  '/data/lesson1.js',
  '/data/lesson2.js',
  '/data/lesson3.js',
  '/data/lesson4.js',
  '/data/lesson5.js',
  '/data/lesson6.js',
  '/data/lesson7.js',
  '/data/lesson8.js',
  '/data/lesson9.js',
  '/data/lesson10.js',
  '/data/lesson11.js',
  '/data/lesson12.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[Baradhu] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Baradhu] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Baradhu] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Baradhu] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Cache First, then Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          });
      })
  );
});

// Push Notifications (Optional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  event.waitUntil(
    self.registration.showNotification('Baradhu', options)
  );
});
// Request notification permission
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
  }
}