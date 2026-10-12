// Коммерческая полировка меню Суши Бар №1.
// 1) Удаляет 1 позицию без цены (menu-06-027-zapechennye-midi).
// 2) Сокращает избыточное название пиццы "тоок эти менен курица с грибами" -> "курица с грибами" (размеры сохраняются).
// 3) Переписывает ~40 слабых описаний (пустые/stub/обрубки) на коммерческие.
// 4) Чинит опечатки OCR в описаниях сетов.
//
// Использование:
//   node scripts/polish-menu.mjs --dry-run   # только проверка, без записи
//   node scripts/polish-menu.mjs --commit    # JSON + Firestore (ключ берётся вне репозитория)
//
// Firestore: update изменившихся документов (description/name/updatedAt),
// delete 1 документа без цены. Категории, Cloudinary-ссылки, ID не трогаются.

import { readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { loadServiceAccount } from "./lib/service-account.mjs";

const root = process.cwd();
const catalogPath = path.join(root, "audit/menu-pdf-audit/cloudinary-menu-catalog-ready.json");
const args = new Set(process.argv.slice(2));
const mode = args.has("--commit") ? "commit" : "dry-run";

const DELETE_IDS = ["menu-06-027-zapechennye-midi"];

const RENAMES = {
  "menu-06-took-eti-menen-kuritsa-s-gribami-28sm": "курица с грибами (28 см)",
  "menu-06-took-eti-menen-kuritsa-s-gribami-35sm": "курица с грибами (35 см)",
};

const DESCRIPTIONS = {
  "menu-01-klassicheskiy-chay": "Классический чёрный или зелёный чай. Подаётся горячим — простой бодрящий вкус.",
  "menu-01-fruktovyy": "Ароматный фруктовый чай с кусочками фруктов и ягод. Яркий, согревающий, слегка сладкий.",
  "menu-01-imbirnyy-chay": "Согревающий чай с имбирём, лимоном и мёдом. Отлично бодрит в холодную погоду.",
  "menu-01-chay-s-limonom": "Классический чёрный чай с долькой свежего лимона. Лёгкий цитрусовый вкус.",
  "menu-01-kofe-3v1": "Быстрый кофе 3 в 1 — с молоком и сахаром. Подаётся горячим.",
  "menu-05-fri": "Хрустящий картофель фри золотистого цвета. Подаётся с соусом на выбор.",
  "menu-05-kartofel-po-derevenskiy": "Румяные дольки картофеля по-деревенски со специями: хрустящие снаружи, мягкие внутри.",
  "menu-05-naggetsy-200-g-ne-ostrye": "Хрустящие куриные наггетсы, 200 г. Нежные внутри, с золотистой панировкой. Подаются с соусом.",
  "menu-05-naggetsy-200-g-ostrye": "Хрустящие куриные наггетсы с острой перчинкой, 200 г. Подаются с соусом.",
  "menu-05-naggetsy-300-g-ne-ostrye": "Хрустящие куриные наггетсы, 300 г. Нежные внутри, с золотистой панировкой. Подаются с соусом.",
  "menu-05-naggetsy-300-g-ostrye": "Хрустящие куриные наггетсы с острой перчинкой, 300 г. Подаются с соусом.",
  "menu-05-naggetsy-500-g-ne-ostrye": "Хрустящие куриные наггетсы, 500 г — большая порция для компании. Подаются с соусом.",
  "menu-05-naggetsy-500-g-ostrye": "Хрустящие куриные наггетсы с острой перчинкой, 500 г — большая порция для компании. Подаются с соусом.",
  "menu-05-chiken-kislo-sladkiy-ostryy-200-g": "Сочные кусочки курицы в кисло-сладком соусе с острым перцем, 200 г. Яркий азиатский вкус.",
  "menu-05-chiken-kislo-sladkiy-ostryy-300-g": "Сочные кусочки курицы в кисло-сладком соусе с острым перцем, 300 г. Яркий азиатский вкус.",
  "menu-05-chiken-kislo-sladkiy-ostryy-500-g": "Сочные кусочки курицы в кисло-сладком соусе с острым перцем, 500 г. Яркий азиатский вкус.",
  "menu-05-kuurulgan-midi": "Жареные мидии, 5 шт. Нежные морепродукты с румяной корочкой, подаются с соусом.",
  "menu-03-ramen-took-eti-menen": "Рамен с курицей: пшеничная лапша в насыщенном бульоне, яйцо, зелень, кунжут и острый перец.",
  "menu-03-ramen-mal-eti-menen": "Рамен с говядиной: пшеничная лапша в насыщенном бульоне, яйцо, зелень, кунжут и острый перец.",
  "menu-08-mini-roll-losos": "Мини-ролл с нежным лососем, рисом и нори. Классика для любителей красной рыбы.",
  "menu-08-mini-roll-ogurets": "Лёгкий мини-ролл с хрустящим огурцом, рисом и нори. Свежий вкус.",
  "menu-08-mini-roll-krab": "Мини-ролл с крабом, рисом и нори. Сладковатое крабовое мясо и сливочный сыр.",
  "menu-08-mini-roll-ugor": "Мини-ролл с копчёным угрём, рисом и нори под соусом унаги.",
  "menu-08-gunkan-s-midi": "Гункан с нежными мидиями и рисом. Одна штука — ровно на один укус.",
  "menu-08-gunkan-s-ugrem": "Гункан с копчёным угрём под соусом унаги.",
  "menu-08-gunkan-s-lososem": "Гункан с кусочком свежего лосося и рисом.",
  "menu-08-gunkan-s-kuritsey": "Гункан с курицей — вариант для тех, кто предпочитает мясо.",
  "menu-08-mini-roll-midi": "Мини-ролл с нежными мидиями, рисом и нори.",
  "menu-08-mini-roll-ugor-zapechennyy": "Запечённый мини-ролл с угрём под сырной шапочкой. Тёплый и сытный.",
  "menu-08-mini-roll-losos-zapechennyy": "Запечённый мини-ролл с лососем под сырной шапочкой. Тёплый и сытный.",
  "menu-08-mini-roll-kurinyy": "Мини-ролл с курицей, рисом и нори. Сытный вариант для тех, кто не ест рыбу.",
  "menu-11-sladkiy-roll-shokoladnyy": "Сладкий ролл с шоколадом и сезонными фруктами. Нежный десерт к чаю.",
  "menu-11-sladkiy-roll": "Сладкий ролл с сезонными фруктами и сливочным кремом. Лёгкий десерт.",
  "menu-12-shaurma-mal-eti-menen-obychnaya": "Шаурма с сочной говядиной, свежими овощами и фирменным чесночным соусом в мягком лаваше.",
  "menu-12-shaurma-mal-eti-menen-dvoynoy": "Двойная шаурма с говядиной — вдвое больше мяса, свежие овощи и чесночный соус в лаваше.",
  "menu-12-shaurma-took-eti-menen-obychnaya": "Шаурма с куриным филе, свежими овощами и чесночным соусом в мягком лаваше.",
  "menu-12-shaurma-took-eti-menen-dvoynoy": "Двойная шаурма с курицей — двойная порция филе, овощи и чесночный соус.",
  "menu-12-shaurma-assorti-obychnaya": "Шаурма ассорти — говядина и курица, свежие овощи и фирменный соус в лаваше.",
  "menu-12-shaurma-assorti-tvister": "Шаурма ассорти в формате твистера — говядина и курица с овощами в хрустящей лепёшке.",
  "menu-12-shaurma-zapechennyy": "Запечённая шаурма с румяной сырной корочкой. Мясо, овощи и соус в горячем лаваше.",
  "menu-12-tvister-obychnaya": "Твистер с курицей, свежими овощами и соусом в хрустящей лепёшке.",
  "menu-12-tvister-dvoynoy": "Двойной твистер — двойная порция курицы с овощами и соусом.",
  "menu-14-khot-dog-klassik": "Классический хот-дог с сосиской, свежими овощами и соусами в мягкой булочке.",
  "menu-14-khot-dog-dvoynoy": "Хот-дог с двойной сосиской — вдвое сытнее. Овощи и соусы в мягкой булочке.",
  "menu-14-gamburger-kuritsa": "Гамбургер с куриной котлетой, помидорами, луком, капустой, морковью и чесночным соусом.",
  "menu-14-gamburger-myaso-govyadiny": "Гамбургер с котлетой из говядины, свежими овощами и чесночным соусом.",
  "menu-14-gamburger-dvoynoy-kuritsa": "Двойной гамбургер с курицей — две котлеты, свежие овощи и чесночный соус.",
  "menu-14-gamburger-dvoynoy-myaso-govyadiny": "Двойной гамбургер с говядиной — две котлеты, свежие овощи и чесночный соус.",
  "menu-15-set-o2": "Гриль барбекью 1; Яки Эби маки 1; Суши запечённые лосось 2; Суши запечённые угорь 2; Суши запечённые краб 2",
  "menu-15-set-o4": "Запечённый угорь 1; Запечённый фила 1; Темпура с курицей 1; Калифорния с кунжутом 1; Филадельфия тобика 1",
  "menu-16-kombo-eki-dos": "Шаурма ассорти 2; Наггетсы 200 г; Темпура с миди 1",
};

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const errors = [];
for (const id of DELETE_IDS) {
  if (!catalog.products.some((p) => p.id === id)) errors.push(`Нет товара для удаления: ${id}`);
}
for (const id of Object.keys({ ...RENAMES, ...DESCRIPTIONS })) {
  if (!catalog.products.some((p) => p.id === id)) errors.push(`Нет товара для правки: ${id}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }

const changedDesc = Object.keys(DESCRIPTIONS).length;
console.log(`План: удалить ${DELETE_IDS.length} (${DELETE_IDS.join(", ")}), переименовать ${Object.keys(RENAMES).length}, описаний: ${changedDesc}.`);
console.log(`Итого: ${catalog.products.length} -> ${catalog.products.length - DELETE_IDS.length} товаров.`);

if (mode === "dry-run") {
  console.log("DRY-RUN OK. Запись не выполнялась. Для применения: node scripts/polish-menu.mjs --commit");
  process.exit(0);
}

const ts = new Date().toISOString().replace(/[:.]/g, "-");
await copyFile(catalogPath, path.join(root, `audit/menu-pdf-audit/cloudinary-menu-catalog-ready.before-polish-${ts}.json`));

catalog.products = catalog.products
  .filter((p) => !DELETE_IDS.includes(p.id))
  .map((p) => ({
    ...p,
    name: RENAMES[p.id] ?? p.name,
    description: DESCRIPTIONS[p.id] ?? p.description,
  }));

const ids = catalog.products.map((p) => p.id);
if (new Set(ids).size !== ids.length) throw new Error("ID не уникальны после правок.");
const names = catalog.products.map((p) => p.name.trim().toLowerCase());
if (new Set(names).size !== names.length) throw new Error("Имена не уникальны после правок.");
if (catalog.products.some((p) => !String(p.image || "").startsWith("https://"))) throw new Error("Есть не-HTTPS картинки.");
if (catalog.products.some((p) => !p.description || !p.description.trim())) {
  console.log("Остались без описания:", catalog.products.filter((p) => !p.description?.trim()).map((p) => p.id).join(", "));
}
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`JSON перезаписан: ${catalog.products.length} товаров.`);

const { initializeApp, cert } = await import("firebase-admin/app");
const fs = await import("firebase-admin/firestore");
// Ключ читается из GOOGLE_APPLICATION_CREDENTIALS или --service-account, всегда вне репозитория.
const sa = await loadServiceAccount();
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = fs.getFirestore(app);

const delBackup = { createdAt: new Date().toISOString(), deleted: [] };
for (const id of DELETE_IDS) {
  const d = await db.collection("products").doc(id).get();
  if (d.exists) delBackup.deleted.push({ id, ...d.data() });
}
await writeFile(path.join(root, `audit/menu-polish-delete-backup-${ts}.json`), `${JSON.stringify(delBackup, null, 2)}\n`);

let batch = db.batch();
let n = 0;
const flush = async () => { await batch.commit(); batch = db.batch(); n = 0; };
for (const p of catalog.products) {
  if (DESCRIPTIONS[p.id] !== undefined || RENAMES[p.id] !== undefined) {
    const data = { updatedAt: fs.FieldValue.serverTimestamp() };
    if (DESCRIPTIONS[p.id] !== undefined) data.description = DESCRIPTIONS[p.id];
    if (RENAMES[p.id] !== undefined) data.name = RENAMES[p.id];
    batch.update(db.collection("products").doc(p.id), data);
    if (++n % 400 === 0) await flush();
  }
}
for (const id of DELETE_IDS) { batch.delete(db.collection("products").doc(id)); if (++n % 400 === 0) await flush(); }
await batch.commit();
console.log("Firestore sync OK.");

const [pc, cc] = await Promise.all([db.collection("products").count().get(), db.collection("categories").count().get()]);
console.log(`Firestore сейчас: categories=${cc.data().count}, products=${pc.data().count}.`);
if (pc.data().count !== catalog.products.length) { console.error("Count не совпал с JSON!"); process.exit(1); }
const spot = await db.collection("products").doc("menu-12-shaurma-mal-eti-menen-dvoynoy").get();
console.log("spot:", JSON.stringify(spot.data()?.name), "|", String(spot.data()?.description).slice(0, 60) + "…");
console.log("ПОЛИРОВКА УСПЕШНА.");
