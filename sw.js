const CACHE_NAME = 'psq-v4'; // Nueva versión
const ASSETS = [
  '/',
  '/index.html',
  '/Logo.png',
  '/herramientas.html',
  '/equivalencias.html',
  '/farmacocinetica.html',
  '/farmacocinetica.js',
  '/catatonia.html',
  '/catatonia.js',
  '/calculadora.js'
];

// Instalación: Guardamos las herramientas principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza de versiones antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

// Estrategia: Network First con Cache Fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la red funciona, devolvemos la respuesta actualizada
        return response;
      })
      .catch(() => {
        // Si falla la red (offline), buscamos en caché
        return caches.match(event.request);
      })
  );
});
