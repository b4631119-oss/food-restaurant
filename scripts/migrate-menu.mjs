// Чистая миграция меню Sushi Bar №1 в Firestore.
// Трогает ТОЛЬКО коллекции `products` и `categories`.
// `settings`, `orders`, `orderItems`, `users`, `admins`, `counters` НЕ читаются и НЕ пишутся.
//
// Использование:
//   node scripts/migrate-menu.mjs --dry-run
//     Проверка payload без доступа к Firestore: 16 категорий, 109 товаров,
//     уникальность ID, ссылки категорий, HTTPS-картинки <= 500 символов.
//
//   node scripts/migrate-menu.mjs --commit [--service-account ./sa.json] [--backup ./audit/menu-migration-backup.json]
//     1) backup текущих products/categories в JSON (только чтение этих 2 коллекций),
//     2) batch-удаление ВСЕХ документов products и categories,
//     3) запись 16 категорий (doc ID = id каталога, данные {name, order}),
//     4) запись 109 товаров (doc ID = id товара),
//     5) count-проверка: ровно 16 категорий и 109 товаров.
//
// Креды для --commit: service account JSON (роль Editor/Owner проекта).
// Путь: --service-account или env GOOGLE_APPLICATION_CREDENTIALS.
// Ключ в чат НЕ вставлять — только локальный файл (см. .gitignore).
//
// Почему в товаре больше полей, чем в ТЗ:
// - `category` (имя): витрина группирует по product.category (components/menu-shop.tsx)
//   и читает категории как имена (lib/repo/categories-repo.ts). Один categoryId сломал бы меню.
// - `inStock`: витрина фильтрует по product.inStock, а firestore.rules разрешают
//   заказ только если get(product).data.inStock == true. Дублирует `available`.
// - `weight`: показывает порцию в карточке (portionInfo). Без него карточки беднее, логика не ломается.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(root, "audit/menu-pdf-audit/cloudinary-menu-catalog-ready.json");
const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) {
    const eq = a.indexOf("=");
    if (eq === -1) args.set(a.slice(2), process.argv[i + 1]?.startsWith("--") || i + 1 >= process.argv.length ? "1" : process.argv[++i]);
    else args.set(a.slice(2, eq), a.slice(eq + 1));
  }
}
const mode = args.has("commit") ? "commit" : "dry-run";
const serviceAccountPath = args.get("service-account") ?? process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "";
const backupPath = args.get("backup") ?? path.join(root, `audit/menu-migration-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
if (!Array.isArray(catalog.categories) || !Array.isArray(catalog.products)) {
  throw new Error("Каталог должен содержать массивы categories и products.");
}

// ---- Валидация payload (работает и в dry-run) ----
const errors = [];
const catIds = catalog.categories.map((c) => c.id);
const prodIds = catalog.products.map((p) => p.id);
if (catalog.categories.length !== 16) errors.push(`Категорий ${catalog.categories.length}, ожидалось 16.`);
if (catalog.products.length !== 109) errors.push(`Товаров ${catalog.products.length}, ожидалось 109.`);
if (new Set(catIds).size !== catIds.length) errors.push("ID категорий не уникальны.");
if (new Set(prodIds).size !== prodIds.length) errors.push("ID товаров не уникальны.");
const catById = new Map(catalog.categories.map((c) => [c.id, c]));
for (const p of catalog.products) {
  if (!p.id || !p.name) errors.push(`Товар без id/name: ${JSON.stringify(p).slice(0, 120)}`);
  if (!catById.has(p.categoryId)) errors.push(`Товар ${p.id}: нет категории ${p.categoryId}.`);
  const img = String(p.image ?? "");
  if (!img.startsWith("https://")) errors.push(`Товар ${p.id}: image не HTTPS.`);
  if (img.length > 500) errors.push(`Товар ${p.id}: image длиннее 500 символов.`);
  if (img.startsWith("data:")) errors.push(`Товар ${p.id}: image — data URL (запрещено rules).`);
  if (p.price !== null && !(typeof p.price === "number" && Number.isFinite(p.price) && p.price > 0)) {
    errors.push(`Товар ${p.id}: некорректная цена ${JSON.stringify(p.price)}.`);
  }
  if (typeof p.available !== "boolean") errors.push(`Товар ${p.id}: available не boolean.`);
}
const noPrice = catalog.products.filter((p) => p.price == null);
console.log(`Каталог: ${catalog.categories.length} категорий, ${catalog.products.length} товаров (${noPrice.length} без цены: ${noPrice.map((p) => p.id).join(", ") || "—"}).`);
if (errors.length) {
  console.error(`Валидация НЕ пройдена (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("Валидация payload пройдена: ID уникальны, связи категорий целы, все image — HTTPS <= 500 символов.");

function productDoc(p) {
  const cat = catById.get(p.categoryId);
  // price: null (мидии без цены) пишем как null, available/inStock=false — заказ rules его и так блокируют.
  return {
    name: p.name,
    categoryId: p.categoryId,
    category: cat.name,
    description: String(p.description ?? ""),
    weight: String(p.weight ?? ""),
    price: p.price,
    image: p.image,
    available: p.available === true && p.price != null,
    inStock: p.available === true && p.price != null,
  };
}

if (mode === "dry-run") {
  const sample = productDoc(catalog.products[0]);
  console.log(`DRY-RUN OK. Пример документа products/${catalog.products[0].id}: ${JSON.stringify(sample).slice(0, 300)}…`);
  console.log("Запись не выполнялась. Для реальной миграции: node scripts/migrate-menu.mjs --commit --service-account ./service-account.json");
  process.exit(0);
}

// ---- Commit: нужен firebase-admin + service account ----
let adminApp, adminDb, FIELD;
try {
  const { initializeApp, cert } = await import("firebase-admin/app");
  const fs = await import("firebase-admin/firestore");
  adminApp = { initializeApp, cert };
  adminDb = fs;
  FIELD = fs.FieldValue;
} catch {
  console.error("Пакет firebase-admin не установлен. Выполните: npm i -D firebase-admin");
  process.exit(1);
}
if (!serviceAccountPath) {
  console.error("Нет service account. Положите ключ в ./service-account.json (не в чат!) и запустите с --service-account ./service-account.json");
  process.exit(1);
}
const sa = JSON.parse(await readFile(path.resolve(serviceAccountPath), "utf8"));
const app = adminApp.initializeApp({ credential: adminApp.cert(sa), projectId: sa.project_id });
const db = adminDb.getFirestore(app);

async function deleteWholeCollection(name) {
  let deleted = 0;
  for (;;) {
    const snap = await db.collection(name).limit(400).get();
    if (snap.empty) return deleted;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
    console.log(`  ${name}: удалено ${deleted}…`);
  }
}

console.log("Шаг 0: backup текущих products/categories (settings/orders/users не трогаем)…");
const [oldProducts, oldCategories] = await Promise.all([db.collection("products").get(), db.collection("categories").get()]);
await writeFile(backupPath, `${JSON.stringify({ createdAt: new Date().toISOString(), products: oldProducts.docs.map((d) => ({ id: d.id, ...d.data() })), categories: oldCategories.docs.map((d) => ({ id: d.id, ...d.data() })) }, null, 2)}\n`);
console.log(`Backup: ${oldProducts.size} products + ${oldCategories.size} categories -> ${backupPath}`);

console.log("Шаг 1: удаление ВСЕХ документов products и categories…");
const delProducts = await deleteWholeCollection("products");
const delCategories = await deleteWholeCollection("categories");
console.log(`Удалено: ${delProducts} products, ${delCategories} categories.`);

console.log("Шаг 2: запись 16 категорий (doc ID = id каталога)…");
{
  let batch = db.batch();
  let n = 0;
  for (const c of catalog.categories) {
    batch.set(db.collection("categories").doc(c.id), { name: c.name, order: c.order });
    if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  await batch.commit();
}

console.log("Шаг 3: запись 109 товаров (doc ID = id товара)…");
{
  let batch = db.batch();
  let n = 0;
  for (const p of catalog.products) {
    batch.set(db.collection("products").doc(p.id), { ...productDoc(p), createdAt: FIELD.serverTimestamp(), updatedAt: FIELD.serverTimestamp() });
    if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  await batch.commit();
}

console.log("Шаг 4: верификация count…");
const [catCount, prodCount] = await Promise.all([db.collection("categories").count().get(), db.collection("products").count().get()]);
const nc = catCount.data().count;
const np = prodCount.data().count;
console.log(`Firestore сейчас: categories=${nc}, products=${np}.`);
if (nc !== 16 || np !== 109) {
  console.error(`ВЕРИФИКАЦИЯ НЕ ПРОШЛА: ожидалось 16/109. Backup сохранён: ${backupPath}`);
  process.exit(1);
}
console.log("МИГРАЦИЯ УСПЕШНА: 16 категорий и 109 товаров. settings/orders/users не изменялись.");
