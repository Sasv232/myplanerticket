const SW_VERSION = "0.5.0";
const CACHE_NAME = `planer-${SW_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/tasks",
  "/projects",
  "/habits",
  "/pomodoro",
  "/settings",
  "/login",
  "/register",
  "/messenger",
  "/fitness",
  "/journal",
  "/notifications",
  "/synth",
  "/today",
  "/stats",
];

const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - MyPlanerTicket</title>
  <style>
    body { font-family: system-ui; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #64748b; margin-bottom: 1.5rem; }
    .emoji { font-size: 4rem; margin-bottom: 1rem; }
    button { background: #6366f1; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; }
    button:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="emoji">📡</div>
    <h1>Вы офлайн</h1>
    <p>Проверьте подключение к интернету и попробуйте снова</p>
    <button onclick="window.location.reload()">Повторить</button>
  </div>
</body>
</html>
`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );

  self.clients.claim();

  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "SW_UPDATED", version: SW_VERSION });
    });
  });
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // API requests: network-first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(JSON.stringify({ error: "Offline", offline: true }), {
              headers: { "Content-Type": "application/json" },
              status: 503,
            });
          });
        })
    );
    return;
  }

  // Navigation requests (HTML pages): NETWORK-FIRST
  // This ensures the latest version is always shown
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(OFFLINE_PAGE, {
              headers: { "Content-Type": "text/html; charset=utf-8" },
            });
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images): cache-first with network update
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          return new Response("Offline", { status: 503 });
        });

      return cached || fetched;
    })
  );
});

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "MyPlanerTicket", body: "У вас есть уведомление" };

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: data.url || "/",
    tag: data.tag || "default",
    renotify: true,
    requireInteraction: false,
  };

  if (data.tag === "server_error" || data.tag === "maintenance") {
    options.requireInteraction = true;
  }

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "NAVIGATE", url });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
