import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, writeBatch, type Unsubscribe, type WriteBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { bumpSyncVersion } from "@/lib/repo/settings-repo";
import type { ImportItem } from "@/lib/menu-import";
import type { DemoProduct } from "@/lib/models";

const products = collection(db, "products");
const categories = collection(db, "categories");
const maxDocumentBytes = 900 * 1024;
const maxImageLength = 500;
const batchLimit = 400;
export async function getProducts(): Promise<DemoProduct[]> {
  const snapshot = await getDocs(products);
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as DemoProduct);
}
export function watchProducts(onChange: (items: DemoProduct[]) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(products, (snapshot) => onChange(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as DemoProduct)), (error) => onError?.(error));
}
export async function saveProduct(product: DemoProduct): Promise<void> {
  const { id, ...data } = product;
  const image = String(data.image ?? "");
  if (image.startsWith("data:")) throw new Error("Встроенные изображения запрещены: фото должно быть ссылкой (Cloudinary или /images/…).");
  if (image.length > maxImageLength) throw new Error("Ссылка на фото длиннее 500 символов.");
  if (new TextEncoder().encode(JSON.stringify(data)).length > maxDocumentBytes) throw new Error("Карточка блюда превышает лимит 900 КБ. Уменьшите изображение.");
  await setDoc(doc(db, "products", id), data);
  await bumpSyncVersion();
}
// Удаление тоже сдвигает версию: витрина перечитает каталог при следующей проверке.
export async function deleteProduct(id: string): Promise<void> { await deleteDoc(doc(db, "products", id)); await bumpSyncVersion(); }
type BatchOp = (batch: WriteBatch) => void;
async function commitChunks(ops: BatchOp[]): Promise<void> {
  for (let i = 0; i < ops.length; i += batchLimit) {
    const batch = writeBatch(db);
    ops.slice(i, i + batchLimit).forEach((op) => op(batch));
    await batch.commit();
  }
}
export async function importProducts(items: ImportItem[], mode: "add" | "replace"): Promise<void> {
  const [savedProducts, savedCategories] = await Promise.all([getDocs(products), getDocs(categories)]);
  const ops: BatchOp[] = [];
  const names = [...new Set(items.map((item) => item.category))];
  if (mode === "replace") {
    savedProducts.docs.forEach((item) => ops.push((batch) => batch.delete(item.ref)));
    savedCategories.docs.forEach((item) => ops.push((batch) => batch.delete(item.ref)));
    names.forEach((name, order) => ops.push((batch) => batch.set(doc(db, "categories", name), { name, order })));
  } else {
    const existing = new Set(savedCategories.docs.map((item) => item.id));
    names.filter((name) => !existing.has(name)).forEach((name, index) => ops.push((batch) => batch.set(doc(db, "categories", name), { name, order: savedCategories.size + index })));
  }
  items.forEach((item) => ops.push((batch) => batch.set(doc(products), { name: item.name, description: item.description, weight: item.weight, price: item.price, category: item.category, image: item.image, inStock: true, popular: item.popular })));
  await commitChunks(ops);
  await bumpSyncVersion();
}
