const CACHE_VERSION = "english-review-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_ASSETS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png", "/icons/notification-badge-96.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((cacheName) => !cacheName.startsWith(CACHE_VERSION)).map((cacheName) => caches.delete(cacheName)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const isStaticAsset = url.pathname.startsWith("/icons/") || url.pathname === "/favicon.ico";
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((networkResponse) => {
        const responseToCache = networkResponse.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseToCache));
        return networkResponse;
      });
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = typeof payload.title === "string" ? payload.title : "새 표현 묶음이 추가됐어요";
  const body = typeof payload.body === "string" ? payload.body : "새 공통 토픽을 확인해 보세요.";
  const targetUrl = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/";
  const tag = typeof payload.tag === "string" ? payload.tag : "english-review-topic";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/notification-badge-96.png",
      data: { url: targetUrl }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url;
  const targetUrl = new URL(typeof rawUrl === "string" && rawUrl.startsWith("/") ? rawUrl : "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url === targetUrl) return client.focus();
      }

      for (const client of clientList) {
        if ("navigate" in client && "focus" in client) {
          return client.navigate(targetUrl).then((navigatedClient) => navigatedClient?.focus());
        }
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});
