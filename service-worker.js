const CACHE_NAME = 'consejo-imex-v3';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for everything (so Firebase / live data always tries fresh),
  // falls back to cache only if offline.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// =====================================================================
// Maneja los toques en las notificaciones (incluye el botón de acción
// "✅ Marcar Hecho" que se muestra dentro de la notificación del sistema).
// Sin esto, tocar el botón no hacía absolutamente nada.
// =====================================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'complete_step') {
    // Avisa a la pestaña/app abierta que marque el paso como completado.
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
          clients[0].postMessage({ type: 'CRONO_ACTION', action: 'complete_step' });
        } else {
          // La app no está abierta en ninguna pestaña: ábrela.
          self.clients.openWindow('./index.html');
        }
      })
    );
    return;
  }

  // Toque normal en la notificación (no en un botón): solo abre/enfoca la app.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) clients[0].focus();
      else self.clients.openWindow('./index.html');
    })
  );
});
