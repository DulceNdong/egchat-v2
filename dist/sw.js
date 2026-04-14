// Service Worker v20260415b — no intercepta peticiones a la API
const CACHE = 'egchat-v20260415';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// No interceptar NADA — dejar que el navegador maneje todo directamente
self.addEventListener('fetch', e => {
  // No hacer nada — pasar todas las peticiones directamente a la red
  return;
});
