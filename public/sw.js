// Minimal service worker — enables WebAPK installation on Android Chrome.
// Pass-through fetch: no caching, so dev and prod behave identically.
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
