const CACHE_NAME = 'psq-v6'; // VERSIÓN NUEVA: vital para borrar la caché anterior
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
  '/autoepp.html', 
  '/autoepp.js'  
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

  const requestUrl = new URL(event.request.url);

  // 🔴 EXCEPCIÓN VITAL: Ignorar las peticiones al motor de datos
  // Si la URL contiene "?sheet=", dejamos que el navegador la gestione 
  // directamente con Cloudflare, saltándose el Service Worker.
  if (requestUrl.searchParams.has('sheet')) {
      return; 
  }

  // Para el resto (HTML, JS, CSS, PNG), usamos la caché normal
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
