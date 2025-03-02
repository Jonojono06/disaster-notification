// import { precacheAndRoute } from 'workbox-precaching';

// precacheAndRoute(self.__WB_MANIFEST);

// self.addEventListener('push', (event) => {
//   const data = event.data.json();
//   self.registration.showNotification(data.title, {
//     body: data.body,
//     icon: '/logo192.png',
//   });
// });

// self.addEventListener('notificationclick', (event) => {
//   event.notification.close();
//   event.waitUntil(clients.openWindow('/'));
// });

/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/logo192.png',
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});