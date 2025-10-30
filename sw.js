self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push értesítés fogadása és megjelenítése
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  const title = data.title || "FamilyBoard értesítés";
  const options = {
    body: data.body || "Van új teendő vagy emlékeztető.",
    icon: 'icons/icon-192.png',   // Az értesítési ikon elérési útja
    badge: 'icons/badge-72.png'   // Badge ikon elérési útja (opcionális)
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Értesítés kattintás kezelése (pl. visszairányítás az app főoldalára)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
