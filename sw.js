const CACHE_NAME = 'protocol-v1-cache';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Yükleme (Install)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Önbellek açıldı');
        return cache.addAll(urlsToCache);
      })
  );
});

// İstekleri Yakalama (Fetch)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Önbellekte varsa oradan döndür, yoksa internetten çek
        return response || fetch(event.request);
      })
  );
});

// Güncelleme (Activate)
self.addEventListener('activate', event => {
    // Eski cacheleri temizle (Sürüm atlayınca burası çalışır)
});