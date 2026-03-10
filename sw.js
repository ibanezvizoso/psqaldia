const CACHE_NAME = 'psq-v4'; // Subimos a v4 para limpiar el error anterior de los navegadores
const ASSETS = [
  '/',
  '/Logo.png'
];

// Instalación: Cacheamos lo básico
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log("Fallo preventivo de caché:", err));
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

// Gestión de peticiones (Aquí estaba el error)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. FILTRO DE SEGURIDAD: 
  // Si la petición es para el Worker (lleva "?sheet=") o no es GET,
  // NO usamos event.respondWith. Al no ponerlo, el navegador la gestiona
  // directamente por internet, saltándose el Service Worker.
  if (event.request.method !== 'GET' || url.search.includes('sheet=')) {
    return; 
  }

  // 2. Para el resto de archivos (HTML, Logo, etc.)
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Si falla internet, buscamos en caché
        return caches.match(event.request).then(response => {
          // Si tampoco está en caché, devolvemos un error offline real
          return response || new Response('Sin conexión', { 
            status: 503, 
            statusText: 'Service Unavailable' 
          });
        });
      })
  );
});
