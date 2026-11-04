// Cambia este nombre cada vez que quieras forzar la renovación de la caché en los móviles
const CACHE_NAME = 'psq-v13';

// Páginas y recursos que se guardan al instalar la app.
// IMPORTANTE: usar las URLs "limpias" (sin .html), que son las que se enlazan en la web.
const ASSETS = [
  '/',
  '/herramientas',
  '/opesergas',
  '/recursos',
  '/equivalencias',
  '/farmacocinetica',
  '/farmacocinetica.js',
  '/catatonia',
  '/catatonia.js',
  '/calculadora.js',
  '/autoepp',
  '/autoepp.js',
  '/adswitch',
  '/ADswitch.js',
  '/hipnoticos',
  '/hipnoticosSwitch.js',
  '/Logo.png',
  '/placeholder.svg',
  '/icon-192.png'
];

// Instalación: se guarda cada recurso por separado, para que un fallo puntual
// (un archivo renombrado, un 404...) no impida instalar el service worker entero.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(ASSETS.map(url =>
        cache.add(url).catch(err => console.warn('SW: no se pudo precachear', url, err))
      ))
    )
  );
  self.skipWaiting();
});

// Activación y limpieza de versiones antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Estrategia Fetch: Network First (Prioridad a la Red para ver cambios)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Solo gestionamos nuestro propio dominio. CDNs, WhatsApp, Google Forms, etc. pasan directos.
  if (url.origin !== self.location.origin) return;

  // 🛡️ ESCUDO ANTI-PROXY (Bypass del SW)
  // No interceptamos estas peticiones para que pasen directas por el proxy del hospital
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

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Solo guardamos respuestas correctas: nunca errores 404/500 ni redirecciones
        if (networkResponse.ok && networkResponse.type === 'basic' && !networkResponse.redirected) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return networkResponse;
      })
      .catch(async () => {
        // Sin internet: buscamos en la caché local
        const cached = await caches.match(event.request, { ignoreSearch: event.request.mode === 'navigate' });
        if (cached) return cached;

        // Las entradas compartidas (/nombre-entrada) se sirven con la portada
        if (event.request.mode === 'navigate') {
          const home = await caches.match('/');
          if (home) return home;
        }

        return new Response('Sin conexión. PSQALDÍA necesita internet para actualizarse.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});
