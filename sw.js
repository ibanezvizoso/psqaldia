const CACHE_NAME = 'psq-v1';
// Lista de archivos vitales para que la web no se rompa sin red
const ASSETS = [
  '/',
  '/index.html',
  '/Logo.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// 1. INSTALACIÓN: Guardamos los archivos en la "mochila" del navegador
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// 2. ACTIVACIÓN: Limpiamos cachés antiguas si actualizamos la versión
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

// 3. ESTRATEGIA: Cache First (Si lo tengo guardado, lo doy ya. Si no, lo pido a red)
self.addEventListener('fetch', event => {
  // No cacheamos las peticiones al Excel (queremos datos frescos)
  if (event.request.url.includes('sheet=')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
