// Снимок витринного документа menu/public в public/menu-fallback.json.
//
// Зачем: пока квота чтений Firestore исчерпана, витрина показывает этот файл с самого сайта
// (одно чтение документа на визит уже невозможно) и всё равно отправляет заказ в WhatsApp.
//
// Запуск (ключ лежит ВНЕ репозитория):
//   GOOGLE_APPLICATION_CREDENTIALS=/path/key.json node scripts/export-menu-fallback.mjs
//   node scripts/export-menu-fallback.mjs --service-account /path/key.json
//
// Скрипт только читает menu/public и пишет public/menu-fallback.json.
// Коллекции products, categories, orders и settings не читаются и не меняются.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadServiceAccount } from "./lib/service-account.mjs";

const outputPath = path.join(process.cwd(), "public/menu-fallback.json");
const serviceAccount = await loadServiceAccount();

let adminApp, adminFirestore;
try {
  adminApp = await import("firebase-admin/app");
  adminFirestore = await import("firebase-admin/firestore");
} catch {
  console.error("Пакет firebase-admin не установлен. Выполните: npm i -D firebase-admin");
  process.exit(1);
}

const app = adminApp.initializeApp({ credential: adminApp.cert(serviceAccount), projectId: serviceAccount.project_id });
const snapshot = await adminFirestore.getFirestore(app).doc("menu/public").get();
if (!snapshot.exists) {
  console.error("Документ menu/public не найден. Откройте /admin/menu и нажмите «Опубликовать меню на сайте», затем повторите запуск.");
  process.exit(1);
}

const data = snapshot.data();
const products = Array.isArray(data.products) ? data.products : [];
const categories = Array.isArray(data.categories) ? data.categories : [];
if (!products.length) {
  console.error("В menu/public нет блюд: сначала опубликуйте меню в админке.");
  process.exit(1);
}

const payload = { updatedAt: String(data.updatedAt ?? new Date().toISOString()), categories, products };
await writeFile(outputPath, `${JSON.stringify(payload)}\n`, "utf8");
console.log(`Записано в public/menu-fallback.json: ${products.length} блюд, ${categories.length} категорий, ${(JSON.stringify(payload).length / 1024).toFixed(1)} КБ.`);
