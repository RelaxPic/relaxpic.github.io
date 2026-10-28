// Retire the old Docsify worker, including clients that still have the old page cached.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(self.registration.unregister())
})
