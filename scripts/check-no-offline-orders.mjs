// Статическая защита от возврата «офлайн-заказа»: заказ существует только после подтверждённой
// записи в Firestore, поэтому в коде не должно быть очереди заказов, чека «без номера» и открытия
// WhatsApp в обход успешной записи.
//
// Запуск: node scripts/check-no-offline-orders.mjs
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIRS = ["app", "components", "hooks", "lib"];
const EXTENSIONS = [".ts", ".tsx"];

async function collect(dir) {
  const entries = await readdir(path.join(ROOT, dir), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collect(relative));
    else if (EXTENSIONS.includes(path.extname(entry.name))) files.push(relative);
  }
  return files;
}

const files = (await Promise.all(DIRS.map(collect))).flat();
const sources = new Map();
for (const file of files) sources.set(file, await readFile(path.join(ROOT, file), "utf8"));

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

for (const [file, text] of sources) {
  check(!/queueOrder|retryQueuedOrders|flushOrderQueue|QueuedOrder/.test(text), `${file}: снова появилась очередь заказов`);
  check(!/Заказ без номера/.test(text), `${file}: вернулся чек «Заказ без номера»`);
  check(!/orderNumber: number \| null/.test(text), `${file}: номер заказа снова может быть null`);
  check(!/order\?\.number/.test(text), `${file}: результат записи заказа снова считается необязательным`);
  // Вызовы (не объявление) openWhatsApp допустимы только там, где заказ пишется через submitOrder.
  if (/(?<!function )openWhatsApp\(/.test(text)) {
    check(/submitOrder\(/.test(text), `${file}: WhatsApp открывается без подтверждённой записи заказа`);
  }
}

check(!files.includes(path.join("lib", "order-queue.ts")), "lib/order-queue.ts вернулся: заказы не должны ждать в localStorage");
if (failures.length) {
  console.error("Заказ без подтверждённой записи в Firestore недопустим:");
  failures.forEach((message) => console.error(`✗ ${message}`));
  process.exit(1);
}
console.log(`Проверено файлов: ${files.length}. Обходных путей отправки заказа в WhatsApp нет.`);
