const CACHE_NAME = 'psq-v7'; // Subimos versión para limpiar el error anterior
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
  // Si quieres que los iconos carguen sin internet, añade '/css/all.min.css' aquí en el futuro
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

// Estrategia: Cache First a prueba de balas
self.addEventListener('fetch', event => {
  // 1. Ignorar lo que no sea GET o no sea http/https (como extensiones de Chrome)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // 2. EXCEPCIÓN VITAL: Dejar que los datos del Worker pasen directos a internet
  if (url.searchParams.has('sheet')) {
    return; 
  }

  // 3. Manejo seguro de la respuesta
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Si está en la caché, devolvemos eso al instante
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está, lo pedimos a internet
      return fetch(event.request).then(networkResponse => {
        return networkResponse; // <-- ESTE RETURN ES EL QUE FALLABA
      }).catch(error => {
        // Si no hay internet y el archivo no estaba en caché, evitamos que la web colapse
        console.warn('El Service Worker no pudo obtener:', event.request.url);
        // Devolvemos una respuesta vacía controlada para no lanzar el TypeError
        return new Response('', { status: 404, statusText: 'Not Found offline' });
      });
    })
  );
});
