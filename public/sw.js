// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Eixo', body: 'Nova notificação' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/calendario';
  event.waitUntil(clients.openWindow(url));
});
