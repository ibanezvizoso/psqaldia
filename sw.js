const CACHE_NAME = 'psq-v12'; // Subimos a v12 para invalidar TODO

// 1. Forzamos la limpieza de CUALQUIER caché que no sea la v12
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Borrando caché antigua:', key);
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

// 2. Modificamos el Fetch para que NO use la caché si hay red, 
// y que refresque el index.html sí o sí.
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    // Si es una navegación (entrar a la web), forzamos red
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
