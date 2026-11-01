const CACHE_NAME = "contveiculos-v1";
const ASSETS = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all(ASSETS.map((a) => cache.add(a).catch(() => null))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Supabase, APIs e métodos que não são GET vão direto para a rede
  if (req.method !== "GET" || req.url.includes("supabase.co") || new URL(req.url).origin !== self.location.origin) return;
  // Abertura do app: rede primeiro; o cache serve só como reserva offline
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/").then((r) => r || Response.error())));
    return;
  }
  e.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
