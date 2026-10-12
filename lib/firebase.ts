import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Публичные значения Firebase приходят из .env.local локально и из переменных проекта
// Vercel на хостинге. Резервного конфига больше нет: с фиктивным ключом приложение
// молча уходит в никуда, поэтому в production сборка падает, а в development
// подставляется заглушка с предупреждением.
//
// Значения читаются только статически: Next подставляет process.env.NEXT_PUBLIC_*
// на этапе сборки, динамический доступ process.env[имя] в клиенте не работает.
const NAMES = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const;

type ConfigKey = keyof typeof NAMES;

const raw: Record<ConfigKey, string | undefined> = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missing = (Object.keys(raw) as ConfigKey[]).filter((key) => !raw[key]);
if (missing.length) {
  const names = missing.map((key) => NAMES[key]).join(", ");
  if (process.env.NODE_ENV === "production") {
    throw new Error(`[firebase] Не заданы переменные окружения: ${names}. Добавьте их в Vercel → Settings → Environment Variables и пересоберите проект.`);
  }
  console.warn(`[firebase] В development не заданы: ${names}. Используется заглушка — заполните .env.local.`);
}

const firebaseConfig = {
  apiKey: raw.apiKey ?? "AIzaSyA-development-placeholder-00000000000",
  authDomain: raw.authDomain ?? "development.invalid",
  projectId: raw.projectId ?? "development",
  storageBucket: raw.storageBucket ?? "development.invalid",
  messagingSenderId: raw.messagingSenderId ?? "0",
  appId: raw.appId ?? "1:0:web:0",
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check подтверждает, что запросы идут из нашего приложения, а не из скрипта.
// Включается только при заданном публичном ключе reCAPTCHA v3; принудительную
// проверку включают вручную в консоли Firebase. Без ключа приложение работает как раньше.
const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
if (typeof window !== "undefined" && recaptchaSiteKey) {
  if (process.env.NODE_ENV === "development") {
    // Без отладочного токена App Check блокирует localhost.
    (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export { firebaseApp };
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
