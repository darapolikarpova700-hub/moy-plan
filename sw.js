/* Мой план · офлайн-кэш. Стратегия: отдаём из кэша мгновенно,
   в фоне тянем свежую версию — обновления подхватываются со следующего открытия. */
const C = "fitplan-cache-v1";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(C).then(async c => {
      for (const u of ["./", "./index.html", "./moy-plan.html", "./icon.png"]) {
        try { await c.add(u); } catch (_) {}
      }
    })
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const sameOrigin = req.url.startsWith(self.location.origin);
  const isFont = req.url.includes("fonts.googleapis.com") || req.url.includes("fonts.gstatic.com");
  if (!sameOrigin && !isFont) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(r => {
        if (r && (r.ok || r.type === "opaque")) caches.open(C).then(c => c.put(req, r.clone()));
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
