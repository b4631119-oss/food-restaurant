// Проверки PWA админки без браузера. Запуск: node scripts/verify-admin-pwa.mjs
// Зависимостей нет — только встроенные модули Node. Для service worker логика
// реально исполняется в изолированном контексте и проверяется, что именно попадает в кэш.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const read = (relative) => readFileSync(path.join(ROOT, relative), "utf8");
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
  console.log(`${ok ? "OK  " : "FAIL"} ${message}`);
};

function pngSize(relative) {
  const buffer = readFileSync(path.join(ROOT, relative));
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

// --- 1. Манифест админки ---
const manifest = JSON.parse(read("public/admin.webmanifest"));
const expected = {
  id: "/admin", name: "Админка Sushi Bar №1", short_name: "Админка", start_url: "/admin", scope: "/admin/",
  display: "standalone", orientation: "any", background_color: "#0A1424", theme_color: "#0A1424", lang: "ru",
};
for (const [key, value] of Object.entries(expected)) {
  check(manifest[key] === value, `admin.webmanifest.${key} = ${JSON.stringify(value)} (сейчас ${JSON.stringify(manifest[key])})`);
}
const purposes = manifest.icons.map((icon) => `${icon.sizes}/${icon.purpose}`);
check(purposes.includes("192x192/any"), "манифест содержит иконку 192 purpose=any");
check(purposes.includes("512x512/any"), "манифест содержит иконку 512 purpose=any");
check(purposes.includes("512x512/maskable"), "манифест содержит иконку 512 purpose=maskable");

// --- 2. Манифест сайта не смешивается с админкой ---
const site = JSON.parse(read("public/manifest.json"));
check(site.id === "/" && site.scope === "/", `manifest.json id/scope = "/" (сейчас ${JSON.stringify(site.id)}/${JSON.stringify(site.scope)})`);
check(site.id !== manifest.id && site.scope !== manifest.scope, "манифесты сайта и админки не пересекаются");

// --- 3. Иконки: объявленные пути существуют, реальные размеры PNG совпадают ---
const icons = [...manifest.icons, { src: "/icons/admin-apple-touch-180.png", sizes: "180x180" }];
for (const icon of icons) {
  const relative = path.join("public", icon.src.replace(/^\//, ""));
  const exists = existsSync(path.join(ROOT, relative));
  const size = exists ? pngSize(relative) : null;
  const [width, height] = icon.sizes.split("x").map(Number);
  check(Boolean(size) && size.width === width && size.height === height,
    `${icon.src} — PNG ${icon.sizes} (сейчас ${size ? `${size.width}x${size.height}` : exists ? "не PNG" : "нет файла"})`);
}

// --- 4. Подключение в app/admin/layout.tsx ---
const layout = read("app/admin/layout.tsx");
check(layout.includes('manifest: "/admin.webmanifest"'), "app/admin/layout.tsx подключает /admin.webmanifest");
check(layout.includes("admin-apple-touch-180.png"), "app/admin/layout.tsx подключает apple-иконку админки");
check(/appleWebApp:[\s\S]*?capable:\s*true[\s\S]*?title:\s*"Админка"[\s\S]*?statusBarStyle:\s*"black-translucent"/.test(layout),
  "appleWebApp: capable + title «Админка» + black-translucent");
check(/robots:\s*\{[^}]*index:\s*false/.test(layout), "meta robots noindex для админки");

// --- 5. Офлайн-страница ---
const offline = read("public/offline.html");
check(offline.includes("Нет соединения") && offline.includes("Проверьте интернет и повторите") && offline.includes("Повторить"),
  "offline.html содержит текст «Нет соединения…» и кнопку «Повторить»");

// --- 6. Service worker: исполняем логику и смотрим, что реально попадает в кэш ---
const cacheWrites = [];
const listeners = {};
const noop = () => {};
const cacheStub = {
  put: (request) => { cacheWrites.push(new URL(String(request.url ?? request), "https://shop.example").pathname); },
  addAll: (list) => { list.forEach((url) => cacheWrites.push(url)); },
};
const context = {
  URL, console,
  Response: class Response { constructor(body, init) { Object.assign(this, init ?? {}, { body }); } },
  setTimeout, Promise, Array, Object, RegExp, Number,
  fetch: async () => ({ status: 200, type: "basic", clone() { return this; } }),
  caches: { open: async () => cacheStub, match: async () => undefined, keys: async () => ["sushibar-static-v2"], delete: async () => true },
  self: {
    location: { origin: "https://shop.example" },
    skipWaiting: noop,
    clients: { claim: noop },
    addEventListener: (type, handler) => { (listeners[type] ??= []).push(handler); },
  },
};
vm.runInNewContext(read("public/sw.js"), context);

const run = (type, event) => Promise.allSettled((listeners[type] ?? []).map((handler) => handler(event)));
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

async function fireFetch(url, mode = "no-cors") {
  const pending = [];
  await run("fetch", { request: { url, method: "GET", mode }, respondWith: (promise) => pending.push(promise) });
  await Promise.allSettled(pending);
  await tick();
  return pending.length > 0;
}

const forbidden = [
  "https://shop.example/admin",
  "https://shop.example/admin/orders",
  "https://firestore.googleapis.com/v1/projects/sushi-bar-no1/databases/(default)/documents/orders",
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
  "https://res.cloudinary.com/u6kw/image/upload/v1/menu.jpg",
  "https://api.cloudinary.com/v1_1/u6kw/image/upload",
  "https://wa.me/996990435943?text=order",
];
for (const url of forbidden) {
  const handled = await fireFetch(url);
  check(!handled && !cacheWrites.some((written) => url.includes(written)), `SW не перехватывает и не кэширует ${new URL(url).host}${new URL(url).pathname}`);
}

const before = cacheWrites.length;
await fireFetch("https://shop.example/_next/static/chunks/main.js");
await fireFetch("https://shop.example/icons/admin-192.png");
check(cacheWrites.length > before, "SW кэширует статику (_next/static, иконки)");

const beforeNavigate = cacheWrites.length;
await fireFetch("https://shop.example/", "navigate");
check(cacheWrites.length === beforeNavigate, "навигация и HTML не кэшируются");

await run("install", { waitUntil: (promise) => promise });
await tick();
check(cacheWrites.includes("/offline.html"), "install предкэширует /offline.html");
check(!cacheWrites.includes("/"), "install не предкэширует HTML («/»)");
check(!cacheWrites.some((written) => written === "/admin" || written.startsWith("/admin/")), "install не предкэширует страницы админки");
check(/CACHE_NAME\s*=\s*`[^`]*\$\{CACHE_VERSION\}`/.test(read("public/sw.js")), "имя кэша версионируется");
check(/keys\.filter\(\(key\) => key !== CACHE_NAME\)/.test(read("public/sw.js")), "старые кэши удаляются в activate");

// --- 7. Регистрация SW только в production ---
check(read("components/sw-register.tsx").includes('process.env.NODE_ENV !== "production"'), "SW регистрируется только в production");

// --- 8. Собранный HTML (проверяется, если сборка уже есть) ---
for (const [page, expectedTitle] of [["admin", "Админка"], ["index", "Суши Бар №1"]]) {
  const relative = `.next/server/app/${page}.html`;
  if (!existsSync(path.join(ROOT, relative))) continue;
  const head = read(relative).slice(0, read(relative).indexOf("</head>"));
  const titles = [...head.matchAll(/<meta name="apple-mobile-web-app-title" content="([^"]*)"/g)].map((match) => match[1]);
  check(titles.length === 1 && titles[0] === expectedTitle,
    `${relative}: ровно один apple-mobile-web-app-title = «${expectedTitle}» (сейчас ${JSON.stringify(titles)})`);
}

console.log(failures.length ? `\nПровалено проверок: ${failures.length}` : "\nВсе проверки пройдены.");
process.exit(failures.length ? 1 : 0);
