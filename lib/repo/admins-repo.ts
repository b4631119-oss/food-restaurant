import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const ADMIN_EMAIL = "suhibarno1@gmail.com";
// Админ-доступ: существующий аккаунт ADMIN_EMAIL (вход продолжает работать)
// либо документ admins/{uid}, созданный вручную в Firebase Console.
export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (user.email === ADMIN_EMAIL) return true;
  try { return (await getDoc(doc(db, "admins", user.uid))).exists(); }
  catch { return false; }
}
