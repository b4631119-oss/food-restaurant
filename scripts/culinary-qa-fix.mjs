// Culinary QA fix: заливка исправленных фото + sizeLabel + sync (ЭТАП 2-3).
// Фото-фиксы (37 товаров, public_id неизменны):
//   салаты 3 (острый<-013, греческий<-014, калхозный<-014-кроп),
//   пиццы 14 (7 вкусов, ротация источников; 28 широко / 35 тайт),
//   бургеры p14 4 (все с img-118, разные кадры; двойные ушли с 119),
//   шаурма 8 (мал/тоок по 2 кадра; ассорти+твистер 4 кадра с 106),
//   сеты 4 (кропы со стр.18 — объекты битые),
//   комбо 4 (чистка глитч-полос).
// sizeLabel: всем товарам с variantLabel (норм. "28см"->"28 см").
// Обновляет: JSON (image/sizeLabel/imageSearchQuery), mapping CSV, Firestore.
//
//   node scripts/culinary-qa-fix.mjs --dry-run
//   node scripts/culinary-qa-fix.mjs --commit

import { readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dir = path.join(root, "audit/menu-pdf-audit");
const catalogPath = path.join(dir, "cloudinary-menu-catalog-ready.json");
const mappingPath = path.join(dir, "image-mapping.csv");
const mode = new Set(process.argv.slice(2)).has("--commit") ? "commit" : "dry-run";
const folder = "menu-osh";

// productId -> local webp filename (public/images/menu/pdf/)
const IMAGE_FIX = {};
for (const id of ["menu-02-ostryy-salat", "menu-02-grecheskiy", "menu-02-salat-kalkhoznyy"]) IMAGE_FIX[id] = `${id}.webp`;
for (const f of ["myasnoy-assorti", "et-menen-myasnaya", "pepperoni", "4-mezgil", "4-syra", "took-eti-menen-kuritsa-s-gribami", "margarita"])
  for (const s of ["28sm", "35sm"]) IMAGE_FIX[`menu-06-${f}-${s}`] = `menu-06-${f}-${s}.webp`;
for (const id of ["menu-14-gamburger-kuritsa", "menu-14-gamburger-myaso-govyadiny", "menu-14-gamburger-dvoynoy-kuritsa", "menu-14-gamburger-dvoynoy-myaso-govyadiny"]) IMAGE_FIX[id] = `${id}.webp`;
for (const id of ["menu-12-shaurma-mal-eti-menen-obychnaya", "menu-12-shaurma-mal-eti-menen-dvoynoy", "menu-12-shaurma-took-eti-menen-obychnaya", "menu-12-shaurma-took-eti-menen-dvoynoy", "menu-12-shaurma-assorti-obychnaya", "menu-12-shaurma-assorti-tvister", "menu-12-tvister-obychnaya", "menu-12-tvister-dvoynoy"]) IMAGE_FIX[id] = `${id}.webp`;
for (const id of ["menu-15-mini-set-o1", "menu-15-set-o2", "menu-15-set-o3", "menu-15-set-o4", "menu-16-kombo-dlya-druzey", "menu-16-kombo-eki-dos", "menu-16-kombo-mini", "menu-16-kombo-semeynyy"]) IMAGE_FIX[id] = `${id}.webp`;

const QUERY_FIX = {
  "menu-02-ostryy-salat": "spicy asian beef salad with bell pepper sesame soy sauce, food photography",
  "menu-02-grecheskiy": "greek salad with feta cheese olives tomato cucumber, food photography",
  "menu-02-salat-kalkhoznyy": "village salad with feta olives corn mayonnaise lettuce, food photography",
  "menu-14-gamburger-dvoynoy-kuritsa": "double chicken burger with vegetables garlic sauce, food photography",
  "menu-14-gamburger-dvoynoy-myaso-govyadiny": "double beef burger with vegetables garlic sauce, food photography",
  "menu-15-mini-set-o1": "assorted baked sushi set 18 pieces on plate, food photography",
  "menu-15-set-o2": "large baked sushi set 22 pieces, food photography",
  "menu-15-set-o3": "baked sushi rolls set 24 pieces, food photography",
  "menu-15-set-o4": "premium sushi set 40 pieces tempura philadelphia, food photography",
  "menu-16-kombo-dlya-druzey": "combo platter pizza kebab fries sushi cola for friends, food photography",
  "menu-16-kombo-eki-dos": "combo shawarma nuggets tempura for two, food photography",
  "menu-16-kombo-mini": "mini combo sushi pizza shawarma burger cola, food photography",
  "menu-16-kombo-semeynyy": "family combo pepperoni pizza sushi burgers fries cola, food photography",
};
const normSize = (v) => v.replace(/(\d)см$/, "$1 см");

function dotenvValue(name) {
  if (process.env[name]) return Promise.resolve(process.env[name]);
  return readFile(path.join(root, ".env.local"), "utf8").then((t) => {
    const line = t.split(/\r?\n/).find((e) => e.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim().replace(/^["'](.*)["']$/, "$1") : "";
  }).catch(() => "");
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const fixIds = Object.keys(IMAGE_FIX);
for (const id of fixIds) {
  if (!catalog.products.some((p) => p.id === id)) { console.error(`Нет товара ${id}`); process.exit(1); }
  await readFile(path.join(root, "public/images/menu/pdf", IMAGE_FIX[id]));
}
const sized = catalog.products.filter((p) => p.variantLabel);
console.log(`Фото-фиксы: ${fixIds.length} товаров. sizeLabel: ${sized.length} товаров с variantLabel.`);
if (mode === "dry-run") { console.log("DRY-RUN OK. Для применения: node scripts/culinary-qa-fix.mjs --commit"); process.exit(0); }

const [cloudName, uploadPreset] = await Promise.all([
  dotenvValue("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"), dotenvValue("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"),
]);
if (!cloudName || !uploadPreset) throw new Error("Нет Cloudinary кредов");

const ts = new Date().toISOString().replace(/[:.]/g, "-");
await copyFile(catalogPath, path.join(dir, `cloudinary-menu-catalog-ready.before-culinaryfix-${ts}.json`));

const results = {};
for (const id of fixIds) {
  const bytes = await readFile(path.join(root, "public/images/menu/pdf", IMAGE_FIX[id]));
  const body = new FormData();
  body.set("file", new Blob([bytes], { type: "image/webp" }), IMAGE_FIX[id]);
  body.set("upload_preset", uploadPreset);
  body.set("public_id", `${folder}/${id}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: "POST", body, signal: AbortSignal.timeout(90000),
  });
  const r = await res.json().catch(() => null);
  if (!res.ok || !r?.secure_url || r.public_id !== `${folder}/${id}`) throw new Error(`Upload failed ${id}: HTTP ${res.status}`);
  results[id] = r.secure_url;
  console.log(`Uploaded ${id} -> v${r.version}`);
}

catalog.products = catalog.products.map((p) => {
  const out = { ...p };
  if (results[p.id]) out.image = results[p.id];
  if (QUERY_FIX[p.id]) out.imageSearchQuery = QUERY_FIX[p.id];
  out.sizeLabel = p.variantLabel ? normSize(p.variantLabel) : out.sizeLabel ?? null;
  if (!p.variantLabel && !("sizeLabel" in out)) out.sizeLabel = null;
  return out;
});
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log("JSON обновлён (image/sizeLabel/imageSearchQuery).");

// mapping: per-size/per-product пути + источники салатов/двойного
let mapping = await readFile(mappingPath, "utf8");
const pathFix = {};
for (const f of ["myasnoy-assorti", "et-menen-myasnaya", "pepperoni", "4-mezgil", "4-syra", "took-eti-menen-kuritsa-s-gribami", "margarita"])
  for (const s of ["28sm", "35sm"]) pathFix[`menu-06-${f}-${s}`] = `/images/menu/pdf/menu-06-${f}-${s}.webp`;
for (const id of ["menu-14-gamburger-kuritsa", "menu-14-gamburger-myaso-govyadiny", "menu-14-gamburger-dvoynoy-kuritsa", "menu-14-gamburger-dvoynoy-myaso-govyadiny", "menu-12-shaurma-mal-eti-menen-obychnaya", "menu-12-shaurma-mal-eti-menen-dvoynoy", "menu-12-shaurma-took-eti-menen-obychnaya", "menu-12-shaurma-took-eti-menen-dvoynoy", "menu-12-shaurma-assorti-obychnaya", "menu-12-shaurma-assorti-tvister", "menu-12-tvister-obychnaya", "menu-12-tvister-dvoynoy"]) pathFix[id] = `/images/menu/pdf/${id}.webp`;
for (const [id, p] of Object.entries(pathFix)) {
  const re = new RegExp(`(^${id},[^\\r\\n]*?)/images/menu/pdf/[^,]+\\.webp`, "m");
  if (!re.test(mapping)) throw new Error(`Строка маппинга не найдена: ${id}`);
  mapping = mapping.replace(re, `$1${p}`);
}
const srcFix = { "menu-02-ostryy-salat": 13, "menu-02-grecheskiy": 14, "menu-14-gamburger-dvoynoy-kuritsa": 118, "menu-14-gamburger-dvoynoy-myaso-govyadiny": 118 };
for (const [id, src] of Object.entries(srcFix)) {
  const re = new RegExp(`(^${id},[^\\r\\n]*?/images/menu/pdf/[^,]+\\.webp,)(\\d+)`, "m");
  mapping = mapping.replace(re, `$1${src}`);
}
await writeFile(mappingPath, mapping);
console.log("image-mapping.csv обновлён.");

// Firestore
const { initializeApp, cert } = await import("firebase-admin/app");
const fs = await import("firebase-admin/firestore");
const sa = JSON.parse(await readFile(path.join(root, "service-account.json"), "utf8"));
const db = fs.getFirestore(initializeApp({ credential: cert(sa), projectId: sa.project_id }));
const touched = new Set([...fixIds, ...sized.map((p) => p.id)]);
let batch = db.batch(), n = 0;
const flush = async () => { await batch.commit(); batch = db.batch(); n = 0; };
for (const p of catalog.products) {
  if (!touched.has(p.id)) continue;
  const data = { updatedAt: fs.FieldValue.serverTimestamp(), sizeLabel: p.sizeLabel ?? null };
  if (results[p.id]) data.image = results[p.id];
  batch.update(db.collection("products").doc(p.id), data);
  if (++n % 400 === 0) await flush();
}
await batch.commit();
console.log(`Firestore: ${touched.size} документов (image/sizeLabel/updatedAt).`);

let fail = 0;
await Promise.all(catalog.products.map(async (p) => {
  try {
    const r = await fetch(p.image, { method: "HEAD", signal: AbortSignal.timeout(30000) });
    if (!r.ok || !(r.headers.get("content-type") ?? "").startsWith("image/")) { fail++; console.error(`BAD ${p.id}`); }
  } catch (e) { fail++; console.error(`BAD ${p.id}: ${e.message}`); }
}));
console.log(`HEAD-check: ${catalog.products.length - fail}/${catalog.products.length} OK.`);
if (fail) process.exit(1);
const [pc, cc] = await Promise.all([db.collection("products").count().get(), db.collection("categories").count().get()]);
console.log(`Firestore: products=${pc.data().count}, categories=${cc.data().count}.`);
console.log("CULINARY-FIX УСПЕШЕН.");
