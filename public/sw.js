// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: `${data.task} — ${data.time}`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: data.taskId,
    requireInteraction: true,
    actions: [
      {
        action: 'mark-done',
        title: 'Mark Done'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('⏰ Task Reminder', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'mark-done') {
    // Open the app and mark task as done
    event.waitUntil(
      clients.openWindow('/?action=mark-done&taskId=' + event.notification.tag)
    );
  } else {
    // Just open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
