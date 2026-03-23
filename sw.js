const CACHE_NAME = 'psq-v5'; // Nueva versión para activar cambios
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
  '/calculadora.js',
  '/autoepp.html', // He añadido estas dos ya que son las que
  '/autoepp.js'    // están causando la lentitud actual
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

// Estrategia: Cache First (Prioridad absoluta a la velocidad local)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Si el recurso está en la caché, se devuelve al instante (velocidad máxima)
      if (cachedResponse) {
        return cachedResponse;
      }
      // Si no está en caché (primera vez), se pide por red normalmente
      return fetch(event.request);
    })
  );
});
