# Тест-план правил Firestore (Rules playground)

Правила: [firestore.rules](../firestore.rules). Проверка — Firebase Console → Firestore → Rules → вкладка «Rules playground».
Для каждого кейса укажите тип операции, путь, при необходимости тело документа (`request.resource.data`) и состояние аутентификации.

Ограничение playground: он эмулирует одну запись, а правила публичного заказа читают `getAfter(counters/orders)` —
состояние счётчика «после транзакции». Поэтому кейсы 8–9 (корректный заказ и позиция) в playground пройдут
только если `counters/orders` уже указывает на тот же `orderId` с тем же `number`. Кейсы с ожиданием `deny`
проверяются в playground полностью; позитивные кейсы заказа подтверждаются реальным оформлением на тестовом проекте (раздел ниже).

## Автоматическая проверка (тот же набор без консоли)

47 кейсов (включая идемпотентность заказа, заказ со стола на стол 4 и ссылку «ключ попытки → номер») прогоняются скриптом [scripts/check-firestore-rules.mjs](../scripts/check-firestore-rules.mjs)
через REST API локального эмулятора. Он очищает только данные эмулятора и откажется работать, если эмулятор не отвечает.

```bash
mkdir -p /tmp/rules-test
cat > /tmp/rules-test/firebase.json <<'EOF'
{
  "firestore": { "rules": "ПУТЬ_К_ПРОЕКТУ/firestore.rules" },
  "emulators": { "firestore": { "port": 8080, "host": "127.0.0.1" }, "ui": { "enabled": false } }
}
EOF
npx firebase-tools emulators:start --only firestore --project demo-test --config /tmp/rules-test/firebase.json
# во втором терминале из корня проекта:
node scripts/check-firestore-rules.mjs
```

Текущее состояние правил: 47 из 47 кейсов совпали с ожиданием.

## Как подготовить

1. Узнайте свой uid: Firebase Console → Authentication → Users (колонка User UID).
2. Проверьте, что документ `admins/{ваш uid}` создан: Firestore → Data → коллекция `admins`.
3. В playground для админских кейсов включите «Authenticated» и подставьте тот же uid.
4. Тело документа удобно копировать из таблицы целиком, включая поля, которых быть не должно (они помечены).

## Кейсы

| № | Операция и путь | Данные / контекст | Ожидание |
|---|---|---|---|
| 1 | get `/products/{любой}` | без входа | allow |
| 2 | get `/settings/cafe` | без входа | allow |
| 3 | get `/categories/{любой}` | без входа | allow |
| 4 | list `/orders` | без входа | deny |
| 5 | get `/orders/{любой}` | без входа | deny |
| 6 | get `/admins/{другой uid}` | вход админом | deny |
| 7 | get `/admins/{свой uid}` | вход админом | allow |
| 8 | create `/orders/{новый}` | `number`, `status: "new"`, `type: "delivery"`, `itemsCount: 2`, `name`, `phone`, `address` + `counters/orders.orderId` = этот id | allow |
| 9 | create `/orderItems/{orderId}_{productId}` | `price` и `productName` совпадают с товаром, `quantity: 2`, товар в наличии, заказ создан в той же транзакции | allow |
| 10 | create `/orderItems/{orderId}_{productId}` | `price` на 1 сом меньше цены товара | deny |
| 11 | create `/orderItems/{orderId}_{productId}` | `quantity: 0` | deny |
| 12 | create `/orderItems/{orderId}_{productId}` | `quantity: 21` | deny |
| 13 | create `/orderItems/{orderId}_{productId}` | товар с `inStock: false` | deny |
| 14 | create `/orderItems/{orderId}_{productId}` | `itemId` не равен `orderId_productId` | deny |
| 15 | create `/orders/{новый}` | `itemsCount: 0` | deny |
| 16 | create `/orders/{новый}` | `itemsCount: 31` | deny |
| 17 | create `/orders/{новый}` | лишнее поле, например `total: 1` | deny |
| 18 | create `/orders/{новый}` | `type: "dinein"`, `tableNumber: 7` | deny |
| 19 | create `/orders/{новый}` | `type: "dinein"` без `tableNumber` | deny |
| 20 | create `/orders/{новый}` | `type: "dinein"` с `phone` (в зале телефон запрещён) | deny |
| 21 | create `/orders/{новый}` | `name` из 81 символа | deny |
| 22 | create `/orders/{новый}` | `type: "delivery"`, `deliveryFee: 5001` | deny |
| 23 | create `/orders/{новый}` | `type: "pickup"`, `deliveryFee: 100` (плата только у доставки) | deny |
| 24 | create `/orders/{новый}` | `type: "delivery"`, `mapLink: "http://2gis.kg/..."` | deny |
| 25 | create `/orders/{новый}` | `type: "delivery"`, `mapLink` с пробелом или переводом строки в середине | deny |
| 26 | create `/orders/{новый}` | `status: "completed"` (создавать можно только `new`) | deny |
| 27 | create `/orders/{новый}` | `status: "new"`, но `counters/orders.orderId` — другой заказ | deny |
| 28 | create `/products/{новый}` | без входа | deny |
| 29 | create `/products/{новый}` | вход админом, `image: "https://res.cloudinary.com/..."` | allow |
| 30 | create `/products/{новый}` | вход админом, `image: "data:image/png;base64,..."` | deny |
| 31 | create `/products/{новый}` | вход админом, без поля `image` | allow |
| 32 | update `/counters/orders` | `value` = текущее + 2 | deny |
| 33 | update `/counters/orders` | `value` = текущее + 1 без создания заказа | deny |
| 34 | create `/secrets/{любой}` | без входа и с входом админом | deny |
| 35 | get `/menu/public` | без входа (витрина читает одно чтение вместо коллекций) | allow |
| 36 | create/update `/menu/public` | без входа | deny |
| 37 | create/update `/menu/public` | вход админом (публикация меню из админки) | allow |
| 38 | create `/orders/{существующий id}` | повторная отправка того же `clientOrderId` (двойной клик, повтор после таймаута) | deny |
| 39 | create `/orders/{новый}` | `type: "dinein"`, `tableNumber: 4`, без телефона, `counters/orders` = этот id | allow |
| 40 | get `/orderRefs/{любой}` | без входа (повтор находит первоначальный номер по ключу попытки) | allow |
| 41 | create `/orderRefs/{новый}` | вместе со своим заказом и его номером в той же транзакции | allow |
| 42 | create `/orderRefs/{новый}` | без заказа в транзакции | deny |
| 43 | create `/orderRefs/{новый}` | номер не совпадает с номером заказа | deny |
| 44 | create `/orderRefs/{новый}` | лишнее поле в документе | deny |

## Проверка на тестовом проекте (после публикации правил)

1. Приложение без входа: меню, категории и настройки открываются, список заказов не читается.
2. Заказ со стола по QR: создаётся, номер выдаётся, в админке отображается со статусом «Новый».
3. Заказ с доставкой: создаётся, сумма и доставка совпадают с корзиной.
4. Админка: вход по email и паролю, смена статуса заказа, переключатель наличия блюда.
5. Блюдо без фото: сохранение и переключатель наличия не ломаются.
6. Второй заказ в течение минуты после предыдущего: показывается «Подождите минуту перед следующим заказом».
7. Заказ на 31 позицию: показывается «В заказе не больше 30 позиций».
8. В консоли браузера на странице заказа нет ошибок `permission-denied`.
9. Двойной клик по «Оформить заказ»: создаётся один заказ и один номер — `orders` пополняется одной записью.
10. Поменять цену блюда в админке и оформить заказ из корзины со старой ценой: заказ отклоняется с сообщением про изменившиеся цены, WhatsApp не открывается.
11. Стол №4: нажать «Оформить заказ» при выключенном интернете — показывается ошибка, WhatsApp не открывается.
12. Таймаут оформления: повтор кнопкой и повтор после перезагрузки страницы возвращают тот же номер и не создают второй заказ.
13. Заказ, оформленный между попытками: повтор исходной попытки находит именно её номер через `/orderRefs`, третьего заказа нет.
