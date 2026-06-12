// hm127-v3 — network-first for HTML, cache-first for assets
const CACHE = 'hm127-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  const isHTML = req.headers.get('accept')?.includes('text/html') ||
                 url.pathname.endsWith('.html') ||
                 url.pathname.endsWith('/') ||
                 url.pathname === '';

  if (isHTML) {
    // Network-first: always fetch fresh HTML, fall back to cache if offline
    e.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    // Cache-first for all other assets
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (res?.status === 200 && req.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }))
    );
  }
});
