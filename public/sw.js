/* AceWears Service Worker v2 — Mobile App Shell
   - Precaches the app shell for instant offline loading
   - Network-first for HTML (always get latest version)
   - Cache-first for static assets (fast loading)
   - Background sync for cart/actions when offline
   - Push notification handler
   - Auto-update: when SW version changes, old cache is wiped
*/
const CACHE_VERSION = "acewears-app-v1";
const APP_VERSION = "1.0.0";
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/acewears-logo.svg",
  "/acewears-icon.svg",
  "/hero-woman-3d.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
});

// Listen for SKIP_WAITING messages from the page (for forced updates)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: APP_VERSION, cacheVersion: CACHE_VERSION });
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Network-first for navigation (HTML) — always get latest
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Cache-first for static assets ONLY (never cache API calls)
  const isStaticAsset =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/acewears-") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/sw.js" ||
    /\.(?:svg|png|jpg|jpeg|webp|gif|ico|woff2?|ttf|css|js)$/.test(url.pathname);

  if (url.origin === self.location.origin && isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          })
      )
    );
  }
  // API calls, everything else: let the browser handle normally
});

// Push notifications
self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : { title: "AceWears", body: "New drop alert" };
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/acewears-icon.svg",
      badge: "/acewears-icon.svg",
      vibrate: [80, 30, 80],
      data: payload.data || {},
      actions: [
        { action: "open", title: "Shop Now" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  event.waitUntil(self.clients.matchAll({ type: "window" }).then((clients) => {
    for (const c of clients) {
      if ("focus" in c) return c.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow("/");
  }));
});

// Background sync for offline cart actions
self.addEventListener("sync", (event) => {
  if (event.tag === "acewears-cart-sync") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "CART_SYNC" }));
      })
    );
  }
});
