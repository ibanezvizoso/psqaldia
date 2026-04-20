const CACHE_NAME = 'psq-v12'; // Subimos a v10 para invalidar la anterior

const ASSETS = [

  '/',

  '/index.html',

  '/Logo.png',

  '/herramientas.html',

  '/opesergas.html', // Añadido el nuevo portal

  '/equivalencias.html',

  '/farmacocinetica.html',

  '/farmacocinetica.js',

  '/catatonia.html',

  '/catatonia.js',

  '/calculadora.js',

  '/autoepp.html', 

  '/autoepp.js',

  '/adswitch.html' // Asegúrate de incluir todas tus herramientas

];



// Instalación

self.addEventListener('install', event => {

  event.waitUntil(

    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))

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



  // 🛡️ MANTENEMOS EL ESCUDO ANTI-PROXY (Bypass del SW)

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



  // ESTRATEGIA NETWORK FIRST para HTML y JS

  event.respondWith(

    fetch(event.request)

      .then(networkResponse => {

        // Si la red responde, guardamos una copia actualizada en caché y la devolvemos

        return caches.open(CACHE_NAME).then(cache => {

          cache.put(event.request, networkResponse.clone());

          return networkResponse;

        });

      })

      .catch(() => {

        // Si internet falla (modo offline), buscamos en la caché local

        return caches.match(event.request).then(cachedResponse => {

          if (cachedResponse) return cachedResponse;

          

          // Si no hay internet ni caché, devolvemos el error amigable

          return new Response('Sin conexión. PSQALDÍA necesita internet para actualizarse.', { 

            status: 503, 

            headers: { 'Content-Type': 'text/plain' } 

          });

        });

      })

  );

});
