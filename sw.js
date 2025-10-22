const CACHE = 'familyboard-v1';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith((async ()=>{
    const cached = await caches.match(e.request);
    try{
      const fresh = await fetch(e.request);
      const c = await caches.open(CACHE); c.put(e.request, fresh.clone());
      return fresh;
    }catch{ return cached || Response.error(); }
  })());
});
