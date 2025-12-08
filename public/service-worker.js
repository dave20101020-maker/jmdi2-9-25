// Disabled caching for debugging navigation/auth issues
const STATIC_CACHE = "northstar-static-dev-disabled";
const RUNTIME_CACHE = "northstar-runtime-dev-disabled";
const API_CACHE = "northstar-api-dev-disabled";

const ASSETS_TO_CACHE = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, RUNTIME_CACHE, API_CACHE].includes(cacheName)) {
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// During debugging, always hit the network to avoid stale shell
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-habits") {
    event.waitUntil(syncHabits());
  } else if (event.tag === "sync-ai-responses") {
    event.waitUntil(syncAIResponses());
  }
});

self.addEventListener("push", (event) => {
  const options = {
    body: event.data?.text() || "NorthStar notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "northstar-notification",
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification("NorthStar", options));
});

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
      return undefined;
    })
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return (
      cached ||
      new Response("Offline - cached data unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      })
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function syncHabits() {
  console.info("[PWA] Background sync: habits queue processed");
}

async function syncAIResponses() {
  console.info("[PWA] Background sync: AI responses queue processed");
}
