const CACHE = 'familyhub-pages-v1';
self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll([
    '/', '/index.html', '/app.js', '/offline.html',
    '/manifest.webmanifest', '/icons/icon.svg', '/icons/maskable.svg'
  ]).catch(()=>{})));
});
self.addEventListener('activate', e=>{
  self.clients.claim();
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith((async()=>{
      try {
        const net = await fetch(req);
        const copy = net.clone();
        caches.open(CACHE).then(c=>c.put(req, copy));
        return net;
      } catch {
        return (await caches.match(req)) || (await caches.match('/')) || (await caches.match('/offline.html'));
      }
    })());
    return;
  }
  e.respondWith(caches.match(req).then(r=> r || fetch(req).then(res=>{
    const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); return res;
  })));
});
self.addEventListener('message', e=>{
  if(e.data && e.data.type==='notify' && self.registration.showNotification){
    self.registration.showNotification(e.data.title||'FamilyHub', { body:e.data.body||'' });
  }
});