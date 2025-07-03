const CACHE_NAME = 'filtracja-3d-v1.0.0';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// Instalacja Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalacja');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cachowanie plików');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Aktywacja Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Aktywacja');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Usuwanie starego cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Przechwytywanie zapytań
self.addEventListener('fetch', (event) => {
  // Strategia Cache First dla zasobów statycznych
  if (event.request.url.includes('.js') || 
      event.request.url.includes('.css') || 
      event.request.url.includes('.html') ||
      event.request.url.includes('.png') ||
      event.request.url.includes('.jpg') ||
      event.request.url.includes('.jpeg') ||
      event.request.url.includes('.svg')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Zwróć z cache jeśli dostępne
          if (response) {
            return response;
          }
          
          // Inaczej pobierz z sieci
          return fetch(event.request)
            .then((response) => {
              // Sprawdź czy odpowiedź jest prawidłowa
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Sklonuj odpowiedź
              const responseToCache = response.clone();
              
              // Dodaj do cache
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // Jeśli nie ma połączenia, zwróć stronę offline
              if (event.request.destination === 'document') {
                return caches.match('./index.html');
              }
            });
        })
    );
  } else {
    // Dla innych zapytań używaj strategii Network First
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

// Obsługa wiadomości od aplikacji
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Powiadomienia push (opcjonalne)
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: './icon-192x192.png',
      badge: './icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('Filtracja 3D', options)
    );
  }
});

// Obsługa kliknięć w powiadomienia
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

// Synchronizacja w tle
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Tutaj można dodać logikę synchronizacji
      console.log('Synchronizacja w tle')
    );
  }
});