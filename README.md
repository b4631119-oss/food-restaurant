# Sushi Bar №1

Мобильный сайт суши-кафе в Оше. Меню хранится в Firestore (коллекции `products` и `categories`, импорт из JSON/CSV в админке), контактные данные и условия доставки — в `lib/config.ts`. Корзина хранится в браузере и передаёт готовый чек в WhatsApp; заказы в базу не записываются.

## Запуск

Требуются Node.js и npm.

```bash
npm install
npm run dev
```


