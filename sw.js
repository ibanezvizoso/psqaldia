// Este es el Service Worker básico para que la App sea instalable
self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});
