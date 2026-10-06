import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, writeBatch, type Unsubscribe } from "firebase/firestore";
import menuData from "@/data/menu.json";
import { db } from "@/lib/firebase";
import type { DemoProduct } from "@/lib/models";

const products = collection(db, "products");
const categories = collection(db, "categories");
const maxDocumentBytes = 900 * 1024;
const maxImageLength = 500;
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
}
export async function deleteProduct(id: string): Promise<void> { await deleteDoc(doc(db, "products", id)); }
export async function importMenuIfEmpty(): Promise<{ products: boolean; categories: boolean }> {
  const [savedProducts, savedCategories] = await Promise.all([getDocs(products), getDocs(categories)]);
  const importProducts = savedProducts.empty; const importCategories = savedCategories.empty;
  if (!importProducts && !importCategories) return { products: false, categories: false };
  const batch = writeBatch(db);
  if (importProducts) menuData.products.forEach((product) => batch.set(doc(db, "products", product.id), product));
  if (importCategories) menuData.categories.forEach((name, order) => batch.set(doc(db, "categories", name), { name, order }));
  await batch.commit();
  return { products: importProducts, categories: importCategories };
}
