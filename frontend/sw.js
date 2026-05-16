const CACHE = 'heavenward-v1';
const STATIC = [
  '/',
  '/css/main.css',
  '/css/animations.css',
  '/css/components.css',
  '/js/app.js',
  '/js/api.js',
  '/js/walk.js',
  '/js/whisper.js',
  '/js/hearth.js',
  '/js/prayer.js',
  '/js/dead.js',
  '/js/hours.js',
  '/js/audio.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC.map(u => new Request(u, {cache: 'reload'}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  if (url.pathname.startsWith('/api/')) {
    ev.respondWith(fetch(ev.request));
    return;
  }
  ev.respondWith(
    caches.match(ev.request).then(cached => {
      if (cached) return cached;
      return fetch(ev.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(ev.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
