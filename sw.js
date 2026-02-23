const CACHE_NAME = 'psq-v3'; // Cambiamos a v3 para forzar la actualización
const ASSETS = [
  '/',
  '/Logo.png'
];

// Instalación: No bloqueamos si falla un archivo
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log("Fallo preventivo de caché:", err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  // Ignoramos peticiones que no sean GET (como las de analíticas o POST)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Solo si falla INTERNET por completo, buscamos en la caché
        return caches.match(event.request);
      })
  );
});
