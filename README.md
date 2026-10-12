# Sushi Bar №1

Мобильный сайт суши-кафе в Оше. Меню хранится в Firestore (коллекции `products` и `categories`, импорт из JSON/CSV в админке), контактные данные и условия доставки — в `lib/config.ts`. Корзина хранится в браузере, заказ сохраняется в Firestore для отчётов и передаёт готовый чек в WhatsApp.

## Запуск

Требуются Node.js и npm.

```bash
npm install
npm run dev
```

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните публичные значения. На хостинге те же переменные задаются в Vercel → Settings → Environment Variables.

## Безопасность

### Что публично (не секрет)

- Firebase web config: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`. Это идентификаторы проекта, они попадают в клиентский бандл; доступ ограничивается правилами Firestore (`firestore.rules`) и API-ключами в Google Cloud.
- Cloudinary: имя облака и имя unsigned-пресета — нужны браузеру для загрузки фото.
- reCAPTCHA v3 site key и адрес сайта.

### Что секретно (никогда не коммитить)

- Service account JSON для `firebase-admin` (скрипты миграции). Путь передаётся через `GOOGLE_APPLICATION_CREDENTIALS` или `--service-account`, файл лежит вне репозитория.
- Cloudinary API key/secret (используются только в консоли и в подписанных загрузках, если появятся).
- Пароли и токены любых сервисов; App Check debug-токен.

### Как ротировать ключи

1. Firebase Admin key: Google Cloud → IAM → Service Accounts → создать новый ключ, удалить старый, обновить файл вне репозитория. В git он попадать не должен.
2. Firebase web API key: Google Cloud → APIs & Services → Credentials → ограничить по HTTP-referrer (домены сайта) и по используемым API.
3. Cloudinary: перевыпустить API key/secret в консоли; проверить, что unsigned-пресет ограничен форматами, размером и папкой.
4. reCAPTCHA: перевыпустить site key и обновить `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` в Vercel, затем включить принудительный App Check в Firebase.
5. Переменные Vercel: обновить значения, пересобрать проект, проверить, что старые ключи удалены.

### Защита данных

- Персональные данные клиента (имя, телефон, адрес) хранятся в Firestore и не дольше 30 дней в браузере клиента; в корзине есть чекбокс «Запомнить мои данные».
- Доступ к заказам есть только у администраторов: `admins/{uid}` в Firestore.
- Правила Firestore изменяются только через консоль Firebase и никогда не публикуются из скриптов.
