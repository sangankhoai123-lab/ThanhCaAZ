const CACHE_NAME = 'thanhca-az-v1';
const assets = ['index.html', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets).catch(err => console.log("Cache error:", err));
    })
  );
});

self.addEventListener('fetch', fetchEvent => {
  fetchEvent.respondWith(
    fetch(fetchEvent.request).catch(() => caches.match(fetchEvent.request))
  );
});
