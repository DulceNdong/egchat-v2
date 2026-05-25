// EGCHAT Service Worker — solo notificaciones push (sin interceptar fetch)
// Evita pantalla en blanco en PWA por caché de index.html o JS antiguos
const SW_VERSION = 'egchat-push-v20260525';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CALL_HANDLED') {
    const callId = e.data.callId;
    if (callId) {
      self.registration.getNotifications({ tag: `call-${callId}` }).then((notifs) => {
        notifs.forEach((n) => n.close());
      });
    }
  }
});

const API_BASE = 'https://egchat-api.onrender.com';
const VAPID_PUBLIC_KEY = 'BNeDJFYqIX59vgqEKxWfrI263knyPGHafMEK_WrMPeYaIm8bn62vcOah7hDlgIek4R4utB82g-cT9CwAtGn0wUs';

self.addEventListener('pushsubscriptionchange', (e) => {
  e.waitUntil(
    (async () => {
      try {
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        });
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        let token = '';
        for (const client of clients) {
          const channel = new MessageChannel();
          const tokenPromise = new Promise((resolve) => {
            channel.port1.onmessage = (ev) => resolve(ev.data?.token || '');
            setTimeout(() => resolve(''), 2000);
          });
          client.postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
          token = await tokenPromise;
          if (token) break;
        }
        if (!token) return;
        await fetch(`${API_BASE}/api/push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ subscription: newSubscription.toJSON() }),
        });
      } catch (err) {
        console.warn('pushsubscriptionchange renewal failed:', err);
      }
    })()
  );
});

self.addEventListener('push', (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { title: 'EGChat', body: e.data ? e.data.text() : 'Nueva notificación' };
  }

  const isCall = data.notificationType === 'incoming_call';
  const isGovNews = data.notificationType === 'government_news';
  const title = data.title || 'EGChat';

  const options = isCall
    ? {
        body: data.body || 'Llamada entrante',
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        tag: `call-${data.callId || Date.now()}`,
        renotify: false,
        requireInteraction: true,
        silent: false,
        data: {
          url: '/',
          callId: data.callId,
          callerId: data.callerId,
          callerName: data.callerName,
          callType: data.callType || 'audio',
          notificationType: 'incoming_call',
        },
      }
    : isGovNews
    ? {
        body: data.body || 'Nueva noticia oficial',
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        tag: data.tag || 'gov-news',
        renotify: true,
        requireInteraction: false,
        silent: false,
        data: {
          url: data.url || '/?view=estados&espacio=e1',
          notificationType: 'government_news',
          newsUrl: data.newsUrl || '',
          newsSource: data.newsSource || '',
        },
      }
    : {
        body: data.body || 'Tienes un nuevo mensaje',
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        tag: data.tag || 'egchat-msg',
        renotify: true,
        requireInteraction: false,
        silent: false,
        data: {
          url: data.url || '/',
          chatId: data.chatId || null,
          notificationType: 'message',
        },
      };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const notifData = e.notification.data || {};
  const action = e.action;

  if (notifData.notificationType === 'incoming_call') {
    if (action === 'reject') {
      e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
          for (const w of wins) {
            w.postMessage({ type: 'CALL_REJECTED', callId: notifData.callId });
          }
        })
      );
      return;
    }

    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (wins) => {
        const msg = {
          type: 'INCOMING_CALL',
          callId: notifData.callId,
          callerId: notifData.callerId,
          callerName: notifData.callerName,
          callType: notifData.callType,
          autoAccept: action === 'accept',
        };
        for (const w of wins) {
          if (w.url.includes(self.location.origin)) {
            w.postMessage(msg);
            if ('focus' in w) w.focus();
            return;
          }
        }
        const url = `/?call=${notifData.callId}&caller=${encodeURIComponent(notifData.callerName || '')}&type=${notifData.callType || 'audio'}${action === 'accept' ? '&accept=1' : ''}`;
        const newWin = await clients.openWindow(url);
        if (newWin) {
          setTimeout(() => { try { newWin.postMessage(msg); } catch {} }, 2000);
        }
      })
    );
    return;
  }

  if (action === 'dismiss') return;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const targetUrl = notifData.url || '/';
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && 'focus' in w) {
          if (notifData.notificationType === 'government_news') {
            w.postMessage({ type: 'OPEN_GOV_NEWS', newsUrl: notifData.newsUrl, newsSource: notifData.newsSource });
          } else {
            w.postMessage({ type: 'NOTIFICATION_CLICK', chatId: notifData.chatId });
          }
          return w.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('notificationclose', (e) => {
  const notifData = e.notification.data || {};
  if (notifData.notificationType === 'incoming_call') {
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        w.postMessage({ type: 'CALL_MISSED', callId: notifData.callId });
      }
    });
  }
});
