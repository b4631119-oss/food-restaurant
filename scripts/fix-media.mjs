// Data Consistency Audit: исправление несоответствий фото (ЭТАП 2-3).
// 10 товаров получают корректные фото из PDF-архива (те же public_id, overwrite).
// Обновляет: public webp, image-mapping.csv, JSON (image + imageSearchQuery), Firestore.
//
// Использование:
//   node scripts/fix-media.mjs --dry-run   # проверка плана без записи
//   node scripts/fix-media.mjs --commit    # Cloudinary + JSON + Firestore + HEAD-check 108
//
// public_id сохраняется menu-osh/<product-id>; меняется только версия ассета (vNNN в secure_url).

import { readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dir = path.join(root, "audit/menu-pdf-audit");
const catalogPath = path.join(dir, "cloudinary-menu-catalog-ready.json");
const mappingPath = path.join(dir, "image-mapping.csv");
const args = new Set(process.argv.slice(2));
const mode = args.has("--commit") ? "commit" : "dry-run";

// productId -> { src: extracted object no, query: precise English image query }
const FIXES = {
  "menu-08-mini-roll-losos": { src: 59, query: "salmon hosomaki maki rolls, fresh salmon and rice in nori, sushi food photography" },
  "menu-08-mini-roll-ogurets": { src: 58, query: "cucumber hosomaki kappamaki rolls, fresh cucumber and rice in nori, sushi food photography" },
  "menu-08-mini-roll-krab": { src: 62, query: "surimi crab maki rolls, imitation crab and rice in nori, sushi food photography" },
  "menu-08-mini-roll-ugor": { src: 60, query: "eel hosomaki rolls, unagi eel and rice in nori, sushi food photography" },
  "menu-08-gunkan-s-midi": { src: 66, query: "baked mussel gunkan maki, seafood gunkan boat with rice and nori, sushi food photography" },
  "menu-08-gunkan-s-ugrem": { src: 66, query: "baked eel gunkan maki, unagi gunkan boat with rice and nori, sushi food photography" },
  "menu-08-gunkan-s-lososem": { src: 66, query: "baked salmon gunkan maki, salmon gunkan boat with rice and nori, sushi food photography" },
  "menu-08-gunkan-s-kuritsey": { src: 66, query: "baked chicken gunkan maki, chicken gunkan boat with rice and nori, sushi food photography" },
  "menu-11-sladkiy-roll-shokoladnyy": { src: 99, query: "chocolate dessert sushi rolls with chocolate sauce and banana, sweet sushi food photography" },
  "menu-11-sladkiy-roll": { src: 101, query: "fruit dessert sushi rolls with kiwi banana and berry sauce, sweet sushi food photography" },
};
const folder = "menu-osh";

function dotenvValue(name) {
  if (process.env[name]) return Promise.resolve(process.env[name]);
  return readFile(path.join(root, ".env.local"), "utf8").then((t) => {
    const line = t.split(/\r?\n/).find((e) => e.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim().replace(/^["'](.*)["']$/, "$1") : "";
  }).catch(() => "");
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const ids = Object.keys(FIXES);
for (const id of ids) {
  if (!catalog.products.some((p) => p.id === id)) { console.error(`Нет товара ${id}`); process.exit(1); }
}
console.log(`План: ${ids.length} товаров получат корректные фото (overwrite тех же public_id):\n- ${ids.join("\n- ")}`);
if (mode === "dry-run") { console.log("DRY-RUN OK. Для применения: node scripts/fix-media.mjs --commit"); process.exit(0); }

const [cloudName, uploadPreset] = await Promise.all([
  dotenvValue("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"), dotenvValue("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"),
]);
if (!cloudName || !uploadPreset) throw new Error("Нет Cloudinary кредов в .env.local");

const ts = new Date().toISOString().replace(/[:.]/g, "-");
await copyFile(catalogPath, path.join(dir, `cloudinary-menu-catalog-ready.before-mediafix-${ts}.json`));

const results = {};
for (const id of ids) {
  const local = path.join(root, "public/images/menu/pdf", `${id}.webp`);
  const bytes = await readFile(local);
  const body = new FormData();
  body.set("file", new Blob([bytes], { type: "image/webp" }), `${id}.webp`);
  body.set("upload_preset", uploadPreset);
  body.set("public_id", `${folder}/${id}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: "POST", body, signal: AbortSignal.timeout(90000),
  });
  const r = await res.json().catch(() => null);
  if (!res.ok || !r?.secure_url || r.public_id !== `${folder}/${id}`) {
    throw new Error(`Upload failed ${id}: HTTP ${res.status} ${r?.error?.message ?? ""}`);
  }
  results[id] = r.secure_url;
  console.log(`Uploaded ${id} -> v${r.version}`);
}

// JSON: image + precise query
catalog.products = catalog.products.map((p) =>
  results[p.id] ? { ...p, image: results[p.id], imageSearchQuery: FIXES[p.id].query } : p,
);
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log("JSON обновлён.");

// mapping CSV: sourceImage numbers
let mapping = await readFile(mappingPath, "utf8");
for (const id of ids) {
  const re = new RegExp(`(^${id},[^\\r\\n]*?/images/menu/pdf/${id}\\.webp,)(\\d+)`, "m");
  if (!re.test(mapping)) throw new Error(`Строка маппинга не найдена: ${id}`);
  mapping = mapping.replace(re, `$1${FIXES[id].src}`);
}
await writeFile(mappingPath, mapping);
console.log("image-mapping.csv обновлён.");

// Firestore
const { initializeApp, cert } = await import("firebase-admin/app");
const fs = await import("firebase-admin/firestore");
const sa = JSON.parse(await readFile(path.join(root, "service-account.json"), "utf8"));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = fs.getFirestore(app);
let batch = db.batch();
for (const id of ids) {
  batch.update(db.collection("products").doc(id), { image: results[id], updatedAt: fs.FieldValue.serverTimestamp() });
}
await batch.commit();
console.log("Firestore: 10 документов обновлены (image + updatedAt).");

// HEAD-check всех 108
let fail = 0;
await Promise.all(catalog.products.map(async (p) => {
  try {
    const r = await fetch(p.image, { method: "HEAD", signal: AbortSignal.timeout(30000) });
    const t = r.headers.get("content-type") ?? "";
    if (!r.ok || !t.startsWith("image/")) { fail++; console.error(`BAD ${p.id}: HTTP ${r.status} ${t}`); }
  } catch (e) { fail++; console.error(`BAD ${p.id}: ${e.message}`); }
}));
console.log(`HEAD-check: ${catalog.products.length - fail}/${catalog.products.length} OK.`);
if (fail) process.exit(1);
const snap = await db.collection("products").doc(ids[0]).get();
console.log("spot firestore:", ids[0], "->", String(snap.data()?.image).slice(0, 100));
console.log("MEDIA-FIX УСПЕШЕН.");
