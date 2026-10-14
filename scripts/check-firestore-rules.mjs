// Проверка firestore.rules на локальном эмуляторе Firestore (не на живом проекте).
//
// Запуск:
//   1. npx firebase-tools emulators:start --only firestore --project demo-test --config /tmp/rules-test/firebase.json
//      где firebase.json ссылается на этот firestore.rules (см. docs/firestore-rules-test-plan.md);
//   2. node scripts/check-firestore-rules.mjs
//
// Скрипт сам проверяет, что отвечает именно эмулятор, и очищает только его данные.
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const PROJECT = "demo-test";
const BASE = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;
const RESET = `http://${HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`;
const OWNER = "owner";

function jwt(uid) {
  const enc = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const payload = {
    sub: uid, user_id: uid, uid, aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`,
    iat: 0, exp: Math.floor(Date.now() / 1000) + 3600, auth_time: 0,
    firebase: { identities: {}, sign_in_provider: "custom" },
  };
  return `${enc({ alg: "none", typ: "JWT" })}.${enc(payload)}.`;
}
const ADMIN = jwt("user-admin");
const CLIENT = jwt("user-client");
const OTHER = "user-other";

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, text: await res.text() };
}
const str = (value) => ({ stringValue: String(value) });
const int = (value) => ({ integerValue: String(value) });
const bool = (value) => ({ booleanValue: value });
const update = (collection, id, fields) => ({ update: { name: `projects/${PROJECT}/databases/(default)/documents/${collection}/${id}`, fields } });
const counter = (value, orderId) => update("counters", "orders", { value: int(value), orderId: str(orderId) });
const ref = (attemptId, number) => update("orderRefs", attemptId, { number: int(number) });
const product = (id, name, price, inStock) => ({
  name: str(name), price: int(price), inStock: bool(inStock), image: str(`https://res.cloudinary.com/demo/${id}.jpg`),
});
function item(orderId, productId, over = {}) {
  const known = { "p-roll": ["Ролл Филадельфия", 300], "p-tea": ["Чай", 100], "p-stop": ["Стоп-лист", 200] };
  const [productName, price] = known[productId];
  return update("orderItems", `${orderId}_${productId}`, {
    orderId: str(orderId), productId: str(productId),
    productName: str(over.productName ?? productName), price: int(over.price ?? price), quantity: int(over.quantity ?? 1),
  });
}
function order(id, number, over = {}) {
  const type = over.type ?? "delivery";
  const fields = {
    type: str(type), status: str(over.status ?? "new"), number: int(number),
    itemsCount: int(over.itemsCount ?? 2), createdAt: str(new Date().toISOString()), source: str("website"),
  };
  const specific = type === "dinein"
    ? { ...(over.noTable ? {} : { tableNumber: int(over.tableNumber ?? 3) }), ...(over.name ? { name: str(over.name) } : {}), ...(over.phone ? { phone: str(over.phone) } : {}) }
    : {
      name: str(over.name ?? "Тест Тестов"), phone: str(over.phone ?? "+996 111 223 344"),
      address: str(over.address ?? "Холматова 10"),
      ...(over.deliveryFee !== undefined ? { deliveryFee: { doubleValue: over.deliveryFee } } : {}),
      ...(over.mapLink ? { mapLink: str(over.mapLink) } : {}),
    };
  return update("orders", id, { ...fields, ...specific, ...(over.extra ?? {}) });
}
const batch = (writes) => ({ writes });
const full = (id, number, over = {}) => batch([order(id, number, over), item(id, "p-roll"), item(id, "p-tea"), counter(number, id)]);

const CASES = [
  ["чтение меню без входа", "allow", "GET", "/products/p-roll", null],
  ["чтение настроек без входа", "allow", "GET", "/settings/cafe", null],
  ["чтение меню одним документом без входа", "allow", "GET", "/menu/public", null],
  ["публикация меню без входа", "deny", "PATCH", "/menu/public", null, { fields: { updatedAt: str("2026-10-14") } }],
  ["публикация меню админом", "allow", "PATCH", "/menu/public", ADMIN, { fields: { updatedAt: str("2026-10-14") } }],
  ["чтение счётчика без входа", "allow", "GET", "/counters/orders", null],
  ["список заказов без входа", "deny", "GET", "/orders", null],
  ["чтение заказа без входа", "deny", "GET", "/orders/o1", null],
  ["чтение чужого admins/{uid}", "deny", "GET", `/admins/${OTHER}`, ADMIN],
  ["чтение своего admins/{uid}", "allow", "GET", `/admins/user-admin`, ADMIN],
  ["запись в admins/{uid}", "deny", "PATCH", "/admins/user-admin", ADMIN, { fields: { note: str("x") } }],
  ["запись товара без входа", "deny", "PATCH", "/products/p-new", null, { fields: { name: str("X"), price: int(1) } }],
  ["товар: ссылка на фото от админа", "allow", "PATCH", "/products/p-a", ADMIN, { fields: { name: str("А"), price: int(10), image: str("https://res.cloudinary.com/demo/a.jpg") } }],
  ["товар: data URL от админа", "deny", "PATCH", "/products/p-b", ADMIN, { fields: { name: str("Б"), price: int(10), image: str("data:image/png;base64,AAAA") } }],
  ["товар без фото от админа", "allow", "PATCH", "/products/p-c", ADMIN, { fields: { name: str("В"), price: int(10) } }],
  ["запись в неизвестную коллекцию", "deny", "PATCH", "/secrets/s1", ADMIN, { fields: { v: str("x") } }],
  ["корректный заказ", "allow", "POST", ":commit", CLIENT, full("o1", 1001)],
  ["заказ: itemsCount 0", "deny", "POST", ":commit", CLIENT, full("o2", 1002, { itemsCount: 0 })],
  ["заказ: itemsCount 31", "deny", "POST", ":commit", CLIENT, full("o3", 1002, { itemsCount: 31 })],
  ["заказ: лишнее поле total", "deny", "POST", ":commit", CLIENT, full("o4", 1002, { extra: { total: int(1) } })],
  ["заказ: status completed", "deny", "POST", ":commit", CLIENT, full("o5", 1002, { status: "completed" })],
  ["заказ: name 81 символ", "deny", "POST", ":commit", CLIENT, full("o6", 1002, { name: "я".repeat(81) })],
  ["заказ: deliveryFee 5001", "deny", "POST", ":commit", CLIENT, full("o7", 1002, { deliveryFee: 5001 })],
  ["заказ: pickup с deliveryFee", "deny", "POST", ":commit", CLIENT, full("o8", 1002, { type: "pickup", deliveryFee: 100 })],
  ["заказ: mapLink http://", "deny", "POST", ":commit", CLIENT, full("o9", 1002, { mapLink: "http://2gis.kg/osh" })],
  ["заказ: mapLink с пробелом", "deny", "POST", ":commit", CLIENT, full("o10", 1002, { mapLink: "https://2gis.kg/osh search" })],
  ["заказ со стола: tableNumber 7", "deny", "POST", ":commit", CLIENT, full("o11", 1002, { type: "dinein", tableNumber: 7 })],
  ["заказ со стола: без tableNumber", "deny", "POST", ":commit", CLIENT, batch([order("o12", 1002, { type: "dinein", noTable: true }), counter(1002, "o12")])],
  ["заказ со стола: с телефоном", "deny", "POST", ":commit", CLIENT, full("o13", 1002, { type: "dinein", phone: "+996 111 223 344" })],
  ["позиция: чужая цена", "deny", "POST", ":commit", CLIENT, batch([order("o14", 1002), item("o14", "p-roll", { price: 299 }), counter(1002, "o14")])],
  ["позиция: количество 0", "deny", "POST", ":commit", CLIENT, batch([order("o15", 1002), item("o15", "p-roll", { quantity: 0 }), counter(1002, "o15")])],
  ["позиция: количество 21", "deny", "POST", ":commit", CLIENT, batch([order("o16", 1002), item("o16", "p-roll", { quantity: 21 }), counter(1002, "o16")])],
  ["позиция: товар не в наличии", "deny", "POST", ":commit", CLIENT, batch([order("o17", 1002), item("o17", "p-stop"), counter(1002, "o17")])],
  ["позиция: чужое название", "deny", "POST", ":commit", CLIENT, batch([order("o18", 1002), item("o18", "p-roll", { productName: "Подмена" }), counter(1002, "o18")])],
  ["заказ без счётчика в транзакции", "deny", "POST", ":commit", CLIENT, batch([order("o19", 1002), item("o19", "p-roll")])],
  ["счётчик: +2 за раз", "deny", "POST", ":commit", CLIENT, batch([counter(1003, "o20")])],
  ["счётчик: +1 без заказа", "deny", "POST", ":commit", CLIENT, batch([counter(1002, "o21")])],
  ["админ пишет заказ без публичной валидации", "allow", "PATCH", "/orders/a1", ADMIN, { fields: { type: str("delivery"), status: str("new"), number: int(7) } }],
  ["админ восстанавливает заказ без itemsCount", "allow", "PATCH", "/orders/a2", ADMIN, { fields: { name: str("Старый"), phone: str("+996 111 223 344"), type: str("pickup"), status: str("completed"), number: int(5) } }],
  ["посетитель: заказ без itemsCount", "deny", "PATCH", "/orders/c1", CLIENT, { fields: { type: str("delivery"), status: str("new"), number: int(7), name: str("Клиент"), phone: str("+996 111 223 344"), address: str("Холматова 10") } }],
  // Идемпотентность заказа: clientOrderId — это id документа. Повторная отправка (двойной клик)
  // не должна ни создать второй заказ, ни перезаписать первый. Отдельно проверяется заказ со стола.
  ["дубль clientOrderId не создаёт второй заказ", "deny", "POST", ":commit", CLIENT, full("o1", 1002)],
  ["заказ со стола: стол 4 сохранён", "allow", "POST", ":commit", CLIENT, full("ord-table-4a", 1002, { type: "dinein", tableNumber: 4 })],
  // Ссылка «ключ попытки → номер»: создаётся только вместе со своим заказом и хранит его номер.
  ["ссылка на заказ: чтение без входа", "allow", "GET", "/orderRefs/r-ok", null],
  ["ссылка на заказ: создана вместе со своим заказом", "allow", "POST", ":commit", CLIENT, batch([order("r-ok", 1003), item("r-ok", "p-roll"), item("r-ok", "p-tea"), counter(1003, "r-ok"), ref("r-ok", 1003)])],
  ["ссылка на заказ: без самого заказа", "deny", "POST", ":commit", CLIENT, batch([ref("r-none", 1004)])],
  ["ссылка на заказ: чужой номер", "deny", "POST", ":commit", CLIENT, batch([order("r-bad", 1004), item("r-bad", "p-roll"), item("r-bad", "p-tea"), counter(1004, "r-bad"), ref("r-bad", 9999)])],
  ["ссылка на заказ: лишнее поле", "deny", "POST", ":commit", CLIENT, batch([order("r-extra", 1004), item("r-extra", "p-roll"), item("r-extra", "p-tea"), counter(1004, "r-extra"), update("orderRefs", "r-extra", { number: int(1004), extra: str("x") })])],
];

const probe = await fetch(RESET, { method: "DELETE" }).catch(() => null);
if (!probe || !probe.ok) {
  console.error(`Эмулятор Firestore не отвечает на http://${HOST}. Запустите его с этим firestore.rules (см. docs/firestore-rules-test-plan.md).`);
  process.exit(2);
}
for (const [collection, id, fields] of [
  ["products", "p-roll", product("p-roll", "Ролл Филадельфия", 300, true)],
  ["products", "p-tea", product("p-tea", "Чай", 100, true)],
  ["products", "p-stop", product("p-stop", "Стоп-лист", 200, false)],
  ["settings", "cafe", { phone: str("+996 990 435 943") }],
  ["menu", "public", { updatedAt: str("2026-10-14"), categories: str("[]"), products: str("[]") }],
  ["admins", "user-admin", { note: str("admin") }],
]) {
  const seeded = await req("PATCH", `/${collection}/${id}?currentDocument.exists=false`, { token: OWNER, body: { fields } });
  if (seeded.status !== 200) {
    console.error(`Не удалось записать ${collection}/${id} от служебного токена: ${seeded.status} ${seeded.text.slice(0, 200)}`);
    process.exit(2);
  }
}

let failed = 0;
for (const [name, expected, method, path, token, body] of CASES) {
  const res = await req(method, path, { token: token ?? undefined, body });
  const allowed = res.status !== 403;
  const pass = expected === "allow" ? allowed : !allowed;
  if (!pass) failed += 1;
  console.log(`${pass ? "✓" : "✗"} ${name} — ожидание ${expected}, ответ ${res.status}${pass ? "" : ` ${res.text.slice(0, 300)}`}`);
}
console.log(failed ? `\nНе прошло кейсов: ${failed} из ${CASES.length}` : `\nВсе кейсы совпали с ожиданием (${CASES.length}).`);
process.exit(failed ? 1 : 0);
