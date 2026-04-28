// Fresh As Ever — Service Worker (stub)
// Full offline support to be implemented in Phase 6

const CACHE_NAME = 'fresh-as-ever-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through — full caching strategy added in Phase 6
  return;
});
