// Service Worker para actualizaciones automáticas de EGCHAT
const CACHE_NAME = 'egchat-v2.0.0';
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

self.addEventListener('install', (event) => {
  console.log('🚀 EGCHAT Service Worker v2.0.0 instalado');
  
  // Forzar activación inmediata
  self.skipWaiting();
  
  // Notificar a todos los clientes
  event.waitUntil(
    self.clients.claimAll().then((clients) => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: '2.0.0',
          message: 'EGCHAT v2.0.0 - Plataforma empresarial completa'
        });
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ EGCHAT Service Worker v2.0.0 activado');
  
  // Limpiar caches antiguos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('🧹 Caches antiguos limpiados');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Verificar si es una petición de actualización
  if (url.pathname === '/api/version-check') {
    event.respondWith(
      new Response(JSON.stringify({
        currentVersion: '2.0.0',
        buildDate: '2026-04-08T09:30:00.000Z',
        features: {
          authentication: 'complete',
          contacts: 'complete',
          wallet: 'complete',
          chat: 'complete',
          services: 'complete',
          supermarkets: 'complete',
          taxis: 'complete',
          insurance: 'complete',
          news: 'complete',
          lia25: 'complete',
          betting: 'complete',
          cemac: 'complete',
          notifications: 'complete',
          files: 'complete',
          realtime: 'complete',
          pwa: 'complete'
        },
        updateAvailable: false
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    );
    return;
  }
  
  // Para peticiones de API, redirigir al backend
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Para archivos estáticos, servir desde cache
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).then((fetchResponse) => {
        // Cachear respuesta exitosa
        if (fetchResponse.ok) {
          const responseClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        
        return fetchResponse;
      });
    })
  );
});

// Sistema de verificación de actualizaciones
let updateCheckInterval;

const startUpdateCheck = () => {
  console.log('🔄 Iniciando verificación de actualizaciones cada 5 minutos');
  
  updateCheckInterval = setInterval(async () => {
    try {
      const response = await fetch('/api/version-check');
      const versionInfo = await response.json();
      
      // Verificar si hay actualización disponible
      if (versionInfo.updateAvailable) {
        console.log('🆕 Actualización disponible:', versionInfo);
        
        // Notificar a todos los clientes
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: versionInfo.latestVersion,
            message: versionInfo.updateMessage || 'Nueva versión disponible'
          });
        });
      }
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
    }
  }, UPDATE_CHECK_INTERVAL);
};

// Iniciar verificación de actualizaciones
startUpdateCheck();

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Limpiar intervalo al desactivar
self.addEventListener('beforeunload', () => {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
});
