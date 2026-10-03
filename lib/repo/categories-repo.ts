import { collection, doc, getDocs, onSnapshot, writeBatch, type Unsubscribe } from "firebase/firestore";
import menuData from "@/data/menu.json";
import { db } from "@/lib/firebase";

const categories = collection(db, "categories");
export async function getCategories(): Promise<string[]> {
  const snapshot = await getDocs(categories);
  return snapshot.docs.map((item) => ({ id: item.id, name: String(item.data().name ?? item.id), order: Number(item.data().order ?? 0) })).sort((a, b) => a.order - b.order).map((item) => item.name);
}
export function watchCategories(onChange: (items: string[]) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(categories, (snapshot) => onChange(snapshot.docs.map((item) => ({ id: item.id, name: String(item.data().name ?? item.id), order: Number(item.data().order ?? 0) })).sort((a, b) => a.order - b.order).map((item) => item.name)), (error) => onError?.(error));
}
export async function saveCategories(names: string[]): Promise<void> {
  const existing = await getDocs(categories); const batch = writeBatch(db); const keep = new Set(names);
  existing.docs.forEach((item) => { if (!keep.has(item.id)) batch.delete(item.ref); });
  names.forEach((name, order) => batch.set(doc(db, "categories", name), { name, order }));
  await batch.commit();
}
export async function importCategoriesIfEmpty(): Promise<boolean> {
  if (!(await getDocs(categories)).empty) return false;
  const batch = writeBatch(db);
  menuData.categories.forEach((name, order) => batch.set(doc(db, "categories", name), { name, order }));
  await batch.commit(); return true;
}
