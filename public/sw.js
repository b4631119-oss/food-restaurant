// Service worker админки и витрины.
// Кэшируем ТОЛЬКО статику (иконки, /_next/static, шрифты, картинки) и /offline.html.
// Никогда не кэшируем /admin/**, Firestore, Firebase Auth, Cloudinary, wa.me и ответы с данными.
const CACHE_VERSION = "v3";
const CACHE_NAME = `sushibar-static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/admin.webmanifest",
  "/icon-192.png",
  "/icons/admin-192.png",
  "/images/favicon.jpg",
];

const STATIC_PREFIXES = ["/_next/static/", "/icons/", "/images/", "/fonts/"];
const STATIC_EXTENSIONS = /\.(?:css|js|mjs|woff2?|ttf|otf|png|jpe?g|webp|avif|svg|ico)$/i;
// Сторонние сервисы и то, что нельзя хранить в кэше никогда.
const NEVER_CACHE = [
  /res\.cloudinary\.com/,
  /api\.cloudinary\.com/,
  /firestore\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /firebaseapp\.com/,
  /wa\.me/,
  /whatsapp\.com/,
];

const isAdmin = (pathname) => pathname === "/admin" || pathname.startsWith("/admin/");
const isForbidden = (href) => NEVER_CACHE.some((pattern) => pattern.test(href));

// Только собственные статические файлы; HTML и ответы с данными остаются сетевыми.
function isCacheableStatic(url) {
  if (url.origin !== self.location.origin) return false;
  if (isAdmin(url.pathname)) return false;
  if (isForbidden(url.href)) return false;
  if (url.pathname === OFFLINE_URL) return true;
  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return true;
  return STATIC_EXTENSIONS.test(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

// Старые версии кэша удаляются, чтобы не оставались устаревшие копии.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Админка, сторонние сервисы и всё, что может содержать данные, — только сеть.
  if (url.origin !== self.location.origin) return;
  if (isAdmin(url.pathname) || isForbidden(url.href)) return;

  // Навигация: сначала сеть; без сети показываем офлайн-страницу.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? new Response("", { status: 503, statusText: "Offline" })),
      ),
    );
    return;
  }

  if (!isCacheableStatic(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fromNetwork = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached ?? new Response("", { status: 504, statusText: "Offline" }));
      return cached ?? fromNetwork;
    }),
  );
});
