// service-worker.js
self.addEventListener('fetch', (event) => {
  // Intercepter seulement les requêtes vers votre API
  if (event.request.url.includes('school-system-backend-ua7r.onrender.com')) {
    event.respondWith(
      caches.open('api-cache').then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Mettre en cache la réponse réussie
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => {
            // Utiliser la version en cache en cas d'échec
            return cache.match(event.request);
          });
      })
    );
  }
});
