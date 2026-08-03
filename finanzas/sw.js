// Service Worker — Finanzas Frank PWA
// Estrategia:
//   • HTML (navegación): network-first → fallback a caché (offline funciona)
//   • CSS local y demás assets: stale-while-revalidate
//   • Firebase / Firestore / Auth: NUNCA se interceptan (manejan su propio offline)

const CACHE = "finanzas-frank-v4";
const APP_SHELL = [
  "/finanzas",
  "/finanzas/index.html",
  "/finanzas/manifest.json?v=4",
  "/finanzas/icon.svg",
  "/finanzas/tailwind.css?v=4",
];

// Dominios que el SW debe ignorar por completo (tiempo real / auth)
const BYPASS = [
  "firestore.googleapis.com",
  "firebaseio.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "google-analytics.com",
  "firebase-settings.crashlytics.com",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Dejar pasar Firebase/Firestore/Auth sin tocar
  if (BYPASS.some((host) => url.hostname.includes(host))) return;

  // Navegación / HTML → network-first
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/finanzas/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/finanzas/index.html"))
    );
    return;
  }

  // Assets (CDN + propios) → stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && (url.origin === self.location.origin || url.protocol === "https:")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
