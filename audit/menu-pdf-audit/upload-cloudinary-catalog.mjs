import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../..");
const sourcePath = path.join(directory, "cloudinary-menu-catalog-2026-10-10.json");
const mappingPath = path.join(directory, "image-mapping.csv");
const outputPath = path.join(directory, "cloudinary-menu-catalog-ready.json");
const progressPath = path.join(directory, ".cloudinary-menu-catalog-upload-progress.json");
const folder = "menu-osh";
const concurrency = 3;

function csvRows(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers, ...records] = rows;
  if (!headers) throw new Error("Image mapping CSV is empty");
  return records.map((values) => Object.fromEntries(headers.map((key, i) => [key.replace(/^\uFEFF/, ""), values[i] ?? ""])));
}

function dotenvValue(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(root, ".env.local");
  return readFile(envPath, "utf8").then((text) => {
    const line = text.split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
    if (!line) return "";
    return line.slice(name.length + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
  }).catch(() => "");
}

async function mapLimit(items, limit, operation) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await operation(items[index]);
    }
  });
  await Promise.all(workers);
}

const [cloudName, uploadPreset] = await Promise.all([
  dotenvValue("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
  dotenvValue("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"),
]);
if (!cloudName || !uploadPreset) throw new Error("Cloudinary cloud name or unsigned upload preset is not configured.");

const catalog = JSON.parse(await readFile(sourcePath, "utf8"));
const mappings = csvRows(await readFile(mappingPath, "utf8"));
if (!Array.isArray(catalog.categories) || !Array.isArray(catalog.products)) throw new Error("Input must contain categories and products arrays.");
const ids = catalog.products.map((product) => product.id);
if (new Set(ids).size !== ids.length) throw new Error("Product IDs are not unique.");
const mappingById = new Map(mappings.map((mapping) => [mapping.productId, mapping]));
if (mappingById.size !== mappings.length) throw new Error("Image mapping contains duplicate product IDs.");
for (const product of catalog.products) {
  const mapping = mappingById.get(product.id);
  if (!mapping?.imagePath) throw new Error(`No local image mapping for ${product.id}.`);
  if (!product.categoryId || !catalog.categories.some((category) => category.id === product.categoryId)) {
    throw new Error(`Missing category relation for ${product.id}.`);
  }
  await readFile(path.join(root, "public", mapping.imagePath.replace(/^\/+/, "")));
}
if (mappingById.size !== catalog.products.length) throw new Error("Image mapping and catalog product counts differ.");

let uploaded = {};
try { uploaded = JSON.parse(await readFile(progressPath, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
let saveQueue = Promise.resolve();
function saveProgress() {
  saveQueue = saveQueue.then(async () => {
    const tempPath = `${progressPath}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(uploaded, null, 2)}\n`);
    await rename(tempPath, progressPath);
  });
  return saveQueue;
}

let stopped = false;
const errors = [];
let completedThisRun = 0;
await mapLimit(catalog.products, concurrency, async (product) => {
  if (stopped || uploaded[product.id]) return;
  const mapping = mappingById.get(product.id);
  const localPath = path.join(root, "public", mapping.imagePath.replace(/^\/+/, ""));
  const bytes = await readFile(localPath);
  const body = new FormData();
  body.set("file", new Blob([bytes], { type: "image/webp" }), path.basename(localPath));
  body.set("upload_preset", uploadPreset);    body.set("public_id", `${folder}/${product.id}`);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
      method: "POST", body, signal: AbortSignal.timeout(90000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.secure_url || !result?.public_id) {
      throw new Error(`Cloudinary upload failed (HTTP ${response.status}): ${result?.error?.message ?? "missing secure_url/public_id"}`);
    }
    const expectedPublicId = `${folder}/${product.id}`;
    const idMatches = result.public_id === expectedPublicId;
    const actualFolder = result.asset_folder ?? result.folder;
    if (!idMatches) {
      throw new Error(`Cloudinary returned unexpected public_id for ${product.id} (public_id=${result.public_id}).`);
    }
    if (new URL(result.secure_url).protocol !== "https:") throw new Error(`Cloudinary did not return HTTPS for ${product.id}.`);
    uploaded[product.id] = { image: result.secure_url, publicId: result.public_id, folder: actualFolder ?? folder };
    await saveProgress();
    completedThisRun++;
    console.log(`Uploaded ${product.id} (${Object.keys(uploaded).length}/${catalog.products.length})`);
  } catch (error) {
    stopped = true;
    errors.push(`${product.id}: ${error.message}`);
    console.error(`Upload failed for ${product.id}: ${error.message}`);
  }
});
await saveQueue;
if (errors.length) throw new Error(`${errors.length} upload(s) failed; successful results were saved for safe resume.`);

const assetIds = catalog.products.map((product) => uploaded[product.id]?.publicId);
if (assetIds.some((id) => !id) || new Set(assetIds).size !== assetIds.length) {
  throw new Error("Uploaded public IDs are missing or not unique; final catalog was not written.");
}

await mapLimit(catalog.products, 5, async (product) => {
  const url = uploaded[product.id].image;
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(30000) });
      const type = response.headers.get("content-type") ?? "";
      if (response.ok && type.startsWith("image/")) return;
      lastError = `HTTP ${response.status}, content-type ${type || "missing"}`;
    } catch (error) { lastError = error.message; }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  throw new Error(`Cloudinary URL check failed for ${product.id}: ${lastError}`);
});

const readyCatalog = {
  ...catalog,
  products: catalog.products.map((product) => ({
    ...product,
    image: uploaded[product.id].image,
    imageStatus: "uploaded",
  })),
};
await writeFile(outputPath, `${JSON.stringify(readyCatalog, null, 2)}\n`);
console.log(`Ready: ${catalog.products.length} products, ${catalog.categories.length} categories, ${completedThisRun} newly uploaded, all HTTPS image URLs returned HTTP 200 with image content-type.`);
