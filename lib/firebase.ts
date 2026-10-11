import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Значения приходят из .env.local локально и из переменных проекта Vercel на хостинге.
// Firebase SDK проверяет формат ключа уже при импорте модуля, поэтому при сборке без переменных
// окружения нельзя передавать undefined: иначе падает пререндер страниц (auth/invalid-api-key).
// Резервный конфиг синтаксически корректен, сеть на этапе сборки не используется, а на клиенте
// всегда работают реальные значения из переменных окружения.
const fromEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const fallback = {
  apiKey: "AIzaSyA00000000000000000000000000000000",
  authDomain: "sushi-bar-no1.firebaseapp.com",
  projectId: "sushi-bar-no1",
  storageBucket: "sushi-bar-no1.appspot.com",
  messagingSenderId: "0",
  appId: "1:000000000000:web:0000000000000000000000",
};

const missing = Object.entries(fromEnv).filter(([, value]) => !value).map(([key]) => key);
// Пишем только в лог сборки: посетителям браузера это сообщение не нужно.
if (missing.length && typeof window === "undefined") {
  console.warn(`[firebase] Не заданы переменные окружения: ${missing.join(", ")}. Использован резервный конфиг — добавьте их в Vercel → Settings → Environment Variables.`);
}

const firebaseConfig = {
  apiKey: fromEnv.apiKey || fallback.apiKey,
  authDomain: fromEnv.authDomain || fallback.authDomain,
  projectId: fromEnv.projectId || fallback.projectId,
  storageBucket: fromEnv.storageBucket || fallback.storageBucket,
  messagingSenderId: fromEnv.messagingSenderId || fallback.messagingSenderId,
  appId: fromEnv.appId || fallback.appId,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
