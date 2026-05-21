// Heavenward service worker.
//
// Caching philosophy: STALE IS IMPOSSIBLE for app code.
//   - HTML, JS, CSS, sw.js, manifest, /version.txt -> network-only, no cache.
//     If the network is unreachable, the browser shows its offline screen.
//     Better than lying about being current with a stale UI.
//   - Images, fonts, icons -> cache-first (rarely change, OK if a stale icon
//     loads while we're offline).
//   - API requests -> straight to the network, never touched.
//
// Activation: on every install of a new build, we (a) call skipWaiting so the
// new SW takes over without waiting for tabs to close, (b) delete EVERY cache
// (not just old-named ones), (c) claim all clients, (d) postMessage them to
// reload. This guarantees no fragment of an old UI survives a deploy.
//
// Build identity: __BUILD__ is replaced at request time by the server with
// the current frontend SHA-1. New build -> new SW bytes -> Chrome triggers
// an automatic update on the next page load.

const BUILD = '__BUILD__';
const IMG_CACHE = 'heavenward-img-' + BUILD;

self.addEventListener('install', ev => {
  // No pre-cache. We want the network on every code fetch.
  ev.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    // Nuke every cache - any name, any build. A clean slate every deploy.
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
    // Tell every open client to reload, so they pick up the new shell now.
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clients) {
      try { c.postMessage({ type: 'sw-activated', build: BUILD }); } catch (e) {}
    }
  })());
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  const url = new URL(req.url);

  // Same-origin only. Anything cross-origin (CDN fonts, web push endpoints,
  // analytics, etc.) goes straight through.
  if (url.origin !== self.location.origin) return;

  // API: never touch.
  if (url.pathname.startsWith('/api/')) {
    ev.respondWith(fetch(req));
    return;
  }

  // App code + shell: NETWORK-ONLY. No cache fallback ever.
  // The list of paths we treat as "code":
  //   - /, *.html
  //   - /sw.js, /version.txt
  //   - *.js, *.css
  //   - /manifest.json
  if (
    url.pathname === '/' ||
    url.pathname === '/sw.js' ||
    url.pathname === '/version.txt' ||
    url.pathname === '/manifest.json' ||
    /\.(html|js|css)$/.test(url.pathname)
  ) {
    ev.respondWith(fetch(req));
    return;
  }

  // Everything else (images, icons, fonts): cache-first.
  ev.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(IMG_CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// === Web Push ===
self.addEventListener('push', ev => {
  let data = {};
  try { data = ev.data ? ev.data.json() : {}; }
  catch (e) { data = { title: 'Heavenward', body: ev.data ? ev.data.text() : 'Time to pray.' }; }
  const title = data.title || 'Heavenward';
  const options = {
    body: data.body || 'Time to pray.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || ('heavenward-' + Date.now()),
    requireInteraction: false,
    data: { url: data.url || '/' }
  };
  ev.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', ev => {
  ev.notification.close();
  const url = (ev.notification.data && ev.notification.data.url) || '/';
  ev.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && 'focus' in w) {
          if (w.navigate) w.navigate(url);
          return w.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
