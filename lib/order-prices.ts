import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { warnFirestore } from "@/lib/firestore-log";
import { getMenuDoc } from "@/lib/repo/menu-repo";
import type { OrderItem } from "@/lib/models";

// Клиентские цены недоверенные: перед записью сверяем корзину с актуальным меню,
// чтобы заказ не ушёл со старой ценой. Итоговая гарантия всё равно в firestore.rules.
export type PriceRow = { name: string; price: number; inStock: boolean };
export type PriceIssue = { productName: string; cartPrice: number; actualPrice: number | null };

const IDS_PER_QUERY = 30;
const productsRef = collection(db, "products");

// Быстрый путь: витринный документ menu/public читается ОДИН раз и содержит все цены.
async function rowsFromMenu(ids: Set<string>): Promise<Map<string, PriceRow>> {
  const rows = new Map<string, PriceRow>();
  try {
    const menu = await getMenuDoc();
    menu?.products.forEach((product) => {
      if (ids.has(product.id)) rows.set(product.id, { name: product.name, price: product.price, inStock: product.inStock });
    });
  } catch (cause) { warnFirestore("orders:menu-check", cause); }
  return rows;
}

// Позиции, которых нет в снимке витрины, читаются карточками блюд — это источник правды для правил.
async function rowsFromProducts(ids: string[]): Promise<Map<string, PriceRow>> {
  const rows = new Map<string, PriceRow>();
  for (let index = 0; index < ids.length; index += IDS_PER_QUERY) {
    const batch = await getDocs(query(productsRef, where(documentId(), "in", ids.slice(index, index + IDS_PER_QUERY))));
    batch.docs.forEach((entry) => {
      const data = entry.data();
      rows.set(entry.id, { name: String(data.name ?? ""), price: Number(data.price ?? 0), inStock: data.inStock === true });
    });
  }
  return rows;
}

// Изменением считаем другую цену, пропавшее или снятое с продажи блюдо и другое название.
function issues(items: OrderItem[], rows: Map<string, PriceRow>): PriceIssue[] {
  return items.flatMap((item) => {
    const row = rows.get(item.productId);
    if (row && row.price === item.price && row.name === item.productName && row.inStock) return [];
    return [{ productName: item.productName, cartPrice: item.price, actualPrice: row ? row.price : null }];
  });
}

export async function changedPrices(items: OrderItem[]): Promise<PriceIssue[]> {
  const ids = new Set(items.map((item) => item.productId));
  const rows = await rowsFromMenu(ids);
  const missing = [...ids].filter((id) => !rows.has(id));
  if (missing.length) for (const [id, row] of await rowsFromProducts(missing)) rows.set(id, row);
  return issues(items, rows);
}

// После отказа правил снимок витрины уже не годится (он мог быть устаревшим): читаем карточки.
export async function changedPricesDirect(items: OrderItem[]): Promise<PriceIssue[]> {
  const rows = await rowsFromProducts([...new Set(items.map((item) => item.productId))]);
  return issues(items, rows);
}
