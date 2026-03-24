const CACHE_NAME = 'psq-v9'; // Versión 9 para forzar la limpieza total
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

// Instalación: Guardamos la estructura principal
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Fuerza a que este SW se instale de inmediato
});

// Activación: Borramos cualquier rastro de las versiones anteriores
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim(); // Toma el control de la página sin tener que recargar
});

// Estrategia Fetch: Cache First + Escudo Anti-Proxy
self.addEventListener('fetch', event => {
  // Ignoramos peticiones que no sean GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 🛡️ EL ESCUDO ANTI-PROXY (SERGAS) 🛡️
  // Si pedimos datos del Worker, CSS, fuentes de FontAwesome o el manifest.json,
  // abortamos la intercepción. El navegador los pedirá de forma nativa
  // y el Proxy del hospital le dejará pasar sin pedir autenticación fantasma.
  if (
    url.searchParams.has('sheet') || 
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.woff2') || 
    url.pathname.endsWith('.woff') || 
    url.pathname.endsWith('.ttf') || 
    url.pathname.endsWith('.json')
  ) {
    return; 
  }

  // Para HTML y JS (lo que está en ASSETS), usamos la caché local
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Si lo tenemos guardado, lo devolvemos al instante
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no, vamos a buscarlo a la red
      return fetch(event.request).catch(() => {
        // 🛑 EVITAMOS EL ERROR "TypeError: Failed to convert value to Response"
        // Si no hay internet, devolvemos un texto de error en lugar de dejar que colapse
        return new Response('Error de conexión local. El proxy bloqueó la petición o no hay internet.', { 
          status: 503, 
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});
