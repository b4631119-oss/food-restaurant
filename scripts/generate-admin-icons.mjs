// Иконки админки: логотип кафе + золотая шестерёнка в углу (визуально отличается от иконки сайта).
// Запуск: node scripts/generate-admin-icons.mjs
// Зависимостей не добавляет: использует sharp, который уже установлен вместе с Next.js.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "icons");
const SOURCE = path.join(ROOT, "public", "icon-512.png"); // логотип кафе
const BACKGROUND = "#0A1424";
const GOLD = "#E9B845";
const GOLD_RING = "#B8862B";

// Шестерёнка: кольцо + N зубцов, вырезанная по центру.
function gear(size, center, teethRadius, ringRadius, holeRadius, teeth) {
  const { x, y } = center;
  const toothWidth = teethRadius * 0.42;
  const toothHeight = teethRadius - ringRadius * 0.6;
  const spikes = [];
  for (let index = 0; index < teeth; index += 1) {
    const angle = (360 / teeth) * index;
    spikes.push(
      `<rect x="${(x - toothWidth / 2).toFixed(2)}" y="${(y - teethRadius).toFixed(2)}" width="${toothWidth.toFixed(2)}" height="${toothHeight.toFixed(2)}" rx="${(toothWidth / 2).toFixed(2)}" transform="rotate(${angle} ${x} ${y})"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g fill="${GOLD}"><circle cx="${x}" cy="${y}" r="${ringRadius}"/>${spikes.join("")}</g>
  <circle cx="${x}" cy="${y}" r="${ringRadius}" fill="none" stroke="${GOLD_RING}" stroke-width="${(ringRadius * 0.14).toFixed(2)}"/>
  <circle cx="${x}" cy="${y}" r="${holeRadius}" fill="${BACKGROUND}"/>
</svg>`;
}

async function render(size, maskable) {
  // Для maskable вся графика держится внутри безопасной зоны (центральные 80%).
  const logoSize = Math.round(size * (maskable ? 0.5 : 0.6));
  const corner = maskable ? 0.56 : 0.72;
  const center = { x: Math.round(size * corner), y: Math.round(size * corner) };
  const teethRadius = size * (maskable ? 0.1 : 0.145);
  const ringRadius = teethRadius * 0.72;

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${logoSize}" height="${logoSize}"><circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize / 2}" fill="#fff"/></svg>`,
  );
  const logo = await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const offset = Math.round((size - logoSize) / 2);
  return sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([
      { input: logo, top: offset, left: offset },
      { input: Buffer.from(gear(size, center, teethRadius, ringRadius, ringRadius * 0.42, 8)) },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, `admin-${size}${maskable ? "-maskable" : ""}.png`));
}

await mkdir(OUT_DIR, { recursive: true });
await render(512, false);
await render(512, true);
await render(192, false);
await sharp(path.join(OUT_DIR, "admin-192.png")).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(OUT_DIR, "admin-apple-touch-180.png"));
console.log("Готово: admin-512.png, admin-512-maskable.png, admin-192.png, admin-apple-touch-180.png в public/icons/");
