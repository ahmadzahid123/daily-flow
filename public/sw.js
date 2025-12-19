// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  let data = { title: '⏰ Task Reminder', body: 'You have a task due!' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }
  
  const options = {
    body: data.body || data.task || 'You have a task due!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: data.taskId || 'task-reminder',
    requireInteraction: true,
    data: data,
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
    self.registration.showNotification(data.title || '⏰ Task Reminder', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification click:', event);
  event.notification.close();
  
  const data = event.notification.data || {};
  
  if (event.action === 'mark-done' && data.taskId) {
    event.waitUntil(
      clients.openWindow('/?action=mark-done&taskId=' + data.taskId)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Install event
self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});
