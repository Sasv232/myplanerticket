const SW_VERSION = "0.3.0";
const CACHE_NAME = `planer-${SW_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/tasks",
  "/board",
  "/calendar",
  "/pomodoro",
  "/settings",
  "/login",
  "/register",
  "/mood",
  "/fitness",
  "/notes",
  "/journal",
  "/habits",
  "/synth",
  "/today",
];

const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - MyPlanerTicket</title>
  <style>
    body { font-family: system-ui; background: #0a0a0a; color: #e5e5e5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #a3a3a3; margin-bottom: 1.5rem; }
    .emoji { font-size: 4rem; margin-bottom: 1rem; }
    button { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; }
    button:hover { background: #2563eb; }
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

  // Skip non-GET requests
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

  // Static assets: cache-first with network update
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
          // Return cached version or offline page for navigation requests
          if (cached) return cached;
          if (request.mode === "navigate") {
            return new Response(OFFLINE_PAGE, {
              headers: { "Content-Type": "text/html; charset=utf-8" },
            });
          }
          return new Response("Offline", { status: 503 });
        });

      return cached || fetched;
    })
  );
});

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "MyPlanerTicket", body: "У вас есть уведомление" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      data: data.url || "/",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data || "/")
  );
});
