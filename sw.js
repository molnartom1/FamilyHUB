/* FamilyHub • Napi Kör — Service Worker (GitHub Pages kompatibilis)
   - NAVIGÁCIÓ: network → cache → beépített offline oldal
   - STATIC: cache-first → network + cache-beírás
   - BASE útvonal automatikus: a self.registration.scope alapján
*/
const CACHE = 'familyhub-v5';

// BASE az SW scope-jából (GitHub Pages: pl. /repo/ vagy /)
const SCOPE_URL = new URL(self.registration.scope);
let BASE = SCOPE_URL.pathname;
if (!BASE.endsWith('/')) BASE += '/';

// Beépített offline oldal (a BASE-t dinamikusan illesztjük be a gombhoz)
function offlineHTML(base) {
  return `<!doctype html>
<html lang="hu"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline • FamilyHub</title>
<style>
  body{margin:0;font-family:system-ui,Segoe UI,Roboto;background:#0b1020;color:#e6eefb;display:grid;place-items:center;height:100vh}
  .box{max-width:560px;padding:24px;border:1px solid #27406b;border-radius:16px;background:#0f1730;box-shadow:0 10px 40px rgba(0,0,0,.35)}
  h1{margin:0 0 8px} p{color:#9fb2d6}
  button{padding:10px 14px;border-radius:12px;border:1px solid #2a3a62;background:#152039;color:#fff;cursor:pointer}
  button:active{transform:translateY(1px)}
</style>
</head><body>
  <div class="box">
    <h1>Offline mód</h1>
    <p>Úgy tűnik, nincs hálózat és ez az oldal még nincs a gyorsítótárban.</p>
    <p>Próbáld meg újra, vagy térj vissza a kezdőlapra.</p>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button onclick="location.reload()">Próbáld újra</button>
      <button onclick="location.href='${base}'">Kezdőlap</button>
    </div>
  </div>
</body></html>`;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // GitHub Pages néha a BASE-re és az index.html-re is külön kérést csinál – mindkettőt precache-eljük
      const precache = [BASE, BASE + 'index.html'];
      try {
        await cache.addAll(precache);
      } catch (e) {
        // Ha valamelyik nem elérhető build közben, nem baj – a runtime fetch úgyis betölti
        // console.warn('Precache hiba', e);
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // NAVIGÁCIÓ: hibrid stratégia
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        // Siker esetén frissítjük a cache-t
        const copy = net.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return net;
      } catch (err) {
        // Hálózati hiba → cache vagy offline oldal
        const cached = await caches.match(req) || await caches.match(BASE) || await caches.match(BASE + 'index.html');
        if (cached) return cached;
        return new Response(offlineHTML(BASE), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // STATIKUS/EGYÉB: cache-first, fallback network + cache-beírás
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      const copy = net.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return net;
    } catch (err) {
      // Ha nem navigáció és nincs cache se hálózat: hagyjuk hibázni (pl. képek)
      throw err;
    }
  })());
});

// Helyi értesítések támogatása (az app postMessage-eli)
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'notify' && self.registration.showNotification) {
    self.registration.showNotification(e.data.title || 'FamilyHub', { body: e.data.body || '' });
  }
});
