// public/sw.js

const CACHE_NAME = 'energy-safe-cache-v1';

// 1. Встановлення (Install) - браузер завантажує SW
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting(); // Змушує SW активуватися негайно
});

// 2. Активація (Activate) - очищення старих кешів
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});

// 3. Перехоплення запитів (Fetch)
// Це ОБОВ'ЯЗКОВА умова для PWA. Поки що робимо найпростіший Network-first підхід.
self.addEventListener('fetch', (event) => {
  // Пропускаємо запити до API та сторонніх ресурсів
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      // Якщо немає інтернету, пробуємо дістати з кешу
      return caches.match(event.request);
    })
  );
});