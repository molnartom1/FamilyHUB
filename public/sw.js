const CACHE = "famboard-v1"
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
]

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener("activate", (e)=>{
  e.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (e)=>{
  const req = e.request
  if (req.method !== "GET") return
  e.respondWith((async ()=>{
    const cached = await caches.match(req)
    try {
      const fresh = await fetch(req)
      const cache = await caches.open(CACHE)
      cache.put(req, fresh.clone())
      return fresh
    } catch {
      return cached || Response.error()
    }
  })())
})
