/* FamilyHub — Service Worker (GitHub Pages kompatibilis) */
const CACHE = 'familyhub-v5';

// BASE az SW scope-jából: pl. /FamilyHUB/
const SCOPE_URL = new URL(self.registration.scope);
let BASE = SCOPE_URL.pathname;
if (!BASE.endsWith('/')) BASE += '/';

// Beépített offline oldal
const OFFLINE_HTML = new Blob([`<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline • FamilyHub</title><style>body{margin:0;font-family:system-ui,Segoe UI,Roboto;background:#0b1020;color:#e6eefb;display:grid;place-items:center;height:100vh}.box{max-width:560px;padding:24px;border:1px solid #27406b;border-radius:16px;background:#0f1730;box-shadow:0 10px 40px rgba(0,0,0,.35)}h1{margin:0 0 8px}p{color:#9fb2d6}button{padding:10px 14px;border-radius:12px;border:1px solid #2a3a62;background:#152039;color:#fff;cursor:pointer}button:active{transform:translateY(1px)}</style></head><body><div class="box"><h1>Offline mód</h1><p>Nincs hálózat és ez az oldal még nincs a gyorsítótárban.</p><div style="display:flex;gap:8px;margin-top:12px"><button onclick="location.reload()">Próbáld újra</button><button onclick="location.href='${BASE}'">Kezdőlap</button></div></div></body></html>`], { type: 'text/html; charset=utf-8' });

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll([BASE, BASE + 'index.html']); } catch {}
  })());
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navigáció: hálózat -> (ha !ok, fallback) -> cache -> offline oldal
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        if (!net.ok) throw new Error('HTTP ' + net.status);
        const copy = net.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return net;
      } catch (err) {
        const cached = await caches.match(req) || await caches.match(BASE) || await caches.match(BASE + 'index.html');
        if (cached) return cached;
        return new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // Egyéb kérések: cache-first, majd network, plusz cache-beírás
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      const copy = net.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return net;
    } catch (err) {
      return cached || Promise.reject(err);
    }
  })());
});

// Egyszerű értesítés fogadás
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'notify' && self.registration.showNotification) {
    self.registration.showNotification(e.data.title || 'FamilyHub', { body: e.data.body || '' });
  }
});
