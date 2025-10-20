const CACHE = 'familyhub-v6';
const SCOPE_URL = new URL(self.registration.scope);
let BASE = SCOPE_URL.pathname; // pl. "/FamilyHUB/"
if(!BASE.endsWith('/')) BASE += '/';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([
      BASE,
      BASE + 'index.html',
      BASE + 'app.js',
      BASE + 'offline.html',
      BASE + 'icons/icon.svg',
      BASE + 'icons/maskable.svg',
      BASE + 'manifest.webmanifest',
    ]).catch(()=>{}))
  );
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        if(!net.ok) throw new Error('HTTP '+net.status);
        const copy = net.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return net;
      } catch (err) {
        const cached = await caches.match(req) || await caches.match(BASE) || await caches.match(BASE + 'index.html') || await caches.match(BASE + 'offline.html');
        if (cached) return cached;
        return Response.redirect(BASE + 'offline.html', 302);
      }
    })());
    return;
  }
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((res) => { const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); return res; }))
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'notify' && self.registration.showNotification) {
    self.registration.showNotification(e.data.title || 'FamilyHub', { body: e.data.body || '' });
  }
});
