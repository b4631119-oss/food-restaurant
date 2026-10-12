import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Админ-доступ определяется ТОЛЬКО документом admins/{uid}, созданным вручную
// в Firebase Console. Почта в правилах и в клиенте не участвует: смена email
// не выдаёт и не отнимает доступ, а утечка адреса не даёт прав.
export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user) return false;
  try {
    return (await getDoc(doc(db, "admins", user.uid))).exists();
  } catch {
    return false;
  }
}
