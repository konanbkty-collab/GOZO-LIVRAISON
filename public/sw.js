/* GOZO LIVRAISON — service worker PWA.
   Le shell et les assets peuvent être retrouvés hors connexion.
   Les API (sessions, commandes, GPS, paiements) ne sont jamais mis en cache. */
const CACHE_NAME = "gozo-shell-v1";
const PRECACHE_URLS = ["/", "/manifest.json", "/logo.svg", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("gozo-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Ne jamais servir une ancienne réponse d'authentification ou de données privées.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/offline.html")) || Response.error()),
    );
    return;
  }

  // Cache des fichiers statiques déjà chargés (JS/CSS, logo, manifest).
  if (url.pathname.startsWith("/_next/static/") || ["script", "style", "image", "font"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
  }
});
