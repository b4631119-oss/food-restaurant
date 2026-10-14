import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { warnFirestore } from "@/lib/firestore-log";
import type { Product } from "@/lib/models";

// Витрина читает ОДИН документ menu/public вместо коллекций products и categories.
// Источник правды остаётся в коллекциях: их правит админка, а republishMenu() собирает снимок.
export type MenuDocCategory = { id: string; name: string; order: number };
export type MenuDocProduct = { id: string; name: string; description: string; weight: string; price: number; categoryId: string; categoryName: string; image: string; inStock: boolean; popular: boolean; order: number };
export type MenuDoc = { updatedAt: string; categories: MenuDocCategory[]; products: MenuDocProduct[] };

// Документ больше 800 КБ не читается витриной за один раз — понятная ошибка вместо тихого сбоя.
export const MENU_MAX_BYTES = 800 * 1024;
// Серия правок (наличие, сохранение, импорт) объединяется в одну публикацию.
export const PUBLISH_DELAY_MS = 3000;

const menuRef = doc(db, "menu", "public");
const productsRef = collection(db, "products");
const categoriesRef = collection(db, "categories");

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const number = (value: unknown, fallback: number): number => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

// Состояние публикации снимка: админка показывает его, чтобы не думать, что правка уже на сайте.
export type PublishStatus = { state: "idle" | "pending" | "ok" | "error"; at: number | null; detail: string };
let publishStatus: PublishStatus = { state: "idle", at: null, detail: "" };
const publishListeners = new Set<(value: PublishStatus) => void>();
function setPublishStatus(next: PublishStatus): void { publishStatus = next; publishListeners.forEach((listener) => listener(next)); }
export function subscribePublishStatus(listener: (value: PublishStatus) => void): () => void {
  publishListeners.add(listener);
  listener(publishStatus);
  return () => { publishListeners.delete(listener); };
}

// Публикация атомарна: клиент видит либо прежний документ, либо целиком новый.
// Если запись не удалась, старый снимок остаётся на месте — половины меню на сайте не бывает.
export async function republishMenu(): Promise<{ products: number; categories: number }> {
  setPublishStatus({ state: "pending", at: publishStatus.at, detail: "Публикуем меню на сайте…" });
  try {
    const result = await writeMenuSnapshot();
    clearDirty();
    setPublishStatus({ state: "ok", at: Date.now(), detail: `${result.products} блюд, ${result.categories} категорий` });
    return result;
  } catch (error) {
    setPublishStatus({ state: "error", at: Date.now(), detail: error instanceof Error ? error.message : "Не удалось записать документ меню." });
    throw error;
  }
}

// Снимок витрины. Коллекции читаются только здесь — при публикации, а не на каждый визит гостя.
async function writeMenuSnapshot(): Promise<{ products: number; categories: number }> {
  const [categoryDocs, productDocs] = await Promise.all([getDocs(categoriesRef), getDocs(productsRef)]);
  const categories: MenuDocCategory[] = categoryDocs.docs
    .map((entry) => ({ id: entry.id, name: text(entry.data().name) || entry.id, order: number(entry.data().order, 0) }))
    .sort((a, b) => a.order - b.order);
  const idByName = new Map(categories.map((category) => [category.name, category.id]));
  const products: MenuDocProduct[] = productDocs.docs.map((entry, index) => {
    const data = entry.data();
    const categoryName = text(data.category);
    return {
      id: entry.id,
      name: text(data.name),
      description: text(data.description),
      weight: text(data.weight),
      price: number(data.price, 0),
      categoryId: text(data.categoryId) || idByName.get(categoryName) || "",
      categoryName,
      image: text(data.image),
      // Как и раньше в витрине, блюдо без флага наличия считается отсутствующим.
      inStock: data.inStock === true,
      popular: Boolean(data.popular),
      order: number(data.itemOrder, index),
    };
  });
  const payload: MenuDoc = { updatedAt: new Date().toISOString(), categories, products };
  const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (bytes > MENU_MAX_BYTES) throw new Error(`Меню занимает ${Math.round(bytes / 1024)} КБ — больше лимита 800 КБ. Сократите описания или число блюд.`);
  await setDoc(menuRef, payload);
  return { products: products.length, categories: categories.length };
}

const DIRTY_KEY = "sushi-bar-no1-menu-dirty";
// Метка «есть неопубликованные правки» переживает закрытие вкладки: таймер публикации живёт
// в браузере админа, поэтому без метки правка могла бы не доехать до сайта.
function markDirty(): void { try { window.localStorage.setItem(DIRTY_KEY, "1"); } catch { /* без метки */ } }
function clearDirty(): void { try { window.localStorage.removeItem(DIRTY_KEY); } catch { /* без метки */ } }
function isDirty(): boolean { try { return window.localStorage.getItem(DIRTY_KEY) === "1"; } catch { return false; } }

let publishTimer: number | null = null;
// Вызывается после сохранения, удаления, импорта блюда и смены наличия: одна публикация на серию правок.
export function scheduleMenuPublish(): void {
  if (typeof window === "undefined") return;
  markDirty();
  if (publishTimer) window.clearTimeout(publishTimer);
  setPublishStatus({ state: "pending", at: publishStatus.at, detail: "Публикуем изменения меню на сайте…" });
  publishTimer = window.setTimeout(() => {
    publishTimer = null;
    void republishMenu().catch((error: unknown) => warnFirestore("menu:publish", error));
  }, PUBLISH_DELAY_MS);
}

// Самовосстановление: если прошлая правка осталась неопубликованной (вкладку закрыли раньше
// таймера или публикация упала), публикуем её при следующем открытии админки.
export function ensureMenuPublished(): void {
  if (typeof window === "undefined" || !isDirty()) return;
  scheduleMenuPublish();
}

// Пустой или отсутствующий документ — это «меню ещё не опубликовано»: витрина идёт прежним путём.
export async function getMenuDoc(): Promise<MenuDoc | null> {
  const snapshot = await getDoc(menuRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<MenuDoc>;
  const products = Array.isArray(data.products) ? data.products : [];
  if (!products.length) return null;
  return { updatedAt: text(data.updatedAt), categories: Array.isArray(data.categories) ? data.categories : [], products };
}

// Документ меню → данные витрины. Порядок блюд сохраняем: категория по order, блюдо по order.
export function menuDocToStorefront(data: MenuDoc): { products: Product[]; categories: string[] } {
  const categories = [...data.categories].sort((a, b) => a.order - b.order);
  const orderByName = new Map(categories.map((category) => [category.name, category.order]));
  const products: Product[] = data.products.map((product, index) => ({
    id: product.id,
    name: text(product.name),
    description: text(product.description),
    weight: text(product.weight),
    price: number(product.price, 0),
    category: text(product.categoryName),
    image: text(product.image),
    inStock: product.inStock === true,
    popular: Boolean(product.popular),
    itemOrder: number(product.order, index),
    categoryOrder: orderByName.get(product.categoryName) ?? 0,
  }));
  return { products, categories: categories.map((category) => category.name) };
}
