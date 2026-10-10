import type { Product } from "@/lib/types";

// Сколько блюд показываем во вкладке «Популярное».
export const POPULAR_LIMIT = 6;

// Ключевые категории фолбэка — ходовое меню в порядке приоритета:
// роллы, пицца, сеты, комбо, шаурма и другие частые заказы.
const KEY_CATEGORIES = ["ролл", "пицца", "сет", "комбо", "шаурм", "бургер", "вок", "суши", "тез татым", "салат", "суп", "десерт", "чай"];

function sales(product: Product): number {
  const value = Number(product.salesCount ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

// Явные признаки хита: флаг «Популярное», рейтинг или число продаж.
export function isHit(product: Product): boolean {
  return Boolean(product.popular || product.isPopular || product.hit) || sales(product) > 0 || Number(product.rating ?? 0) > 0;
}

// Порядок блюда в каталоге: позиции идут в порядке категорий и очереди внутри неё.
function catalogOrder(product: Product): number {
  return (product.categoryOrder ?? 0) * 1000 + (product.itemOrder ?? 0);
}

function compareHits(a: Product, b: Product): number {
  return sales(b) - sales(a) || Number(b.rating ?? 0) - Number(a.rating ?? 0) || catalogOrder(a) - catalogOrder(b);
}

// Блюда ключевых категорий, сгруппированные по приоритету; блюдо попадает только в первую группу.
function keyGroups(products: Product[]): Product[][] {
  const taken = new Set<string>();
  const groups: Product[][] = [];
  for (const keyword of KEY_CATEGORIES) {
    const group = products
      .filter((product) => !taken.has(product.id) && product.category.toLocaleLowerCase("ru").includes(keyword))
      .sort((a, b) => catalogOrder(a) - catalogOrder(b));
    group.forEach((product) => taken.add(product.id));
    if (group.length) groups.push(group);
  }
  return groups;
}

// «Популярное»: сперва блюда с явными признаками хита (топ по продажам и рейтингу),
// затем — по одному блюду из каждой ключевой категории по кругу, чтобы вкладка не пустовала,
// и лишь в самом конце — остаток меню в порядке каталога.
export function popularProducts(products: Product[], limit = POPULAR_LIMIT): Product[] {
  const available = products.filter((product) => product.inStock !== false);
  const picked = available.filter(isHit).sort(compareHits).slice(0, limit);
  if (picked.length >= limit) return picked;
  const chosen = new Set(picked.map((product) => product.id));
  const groups = keyGroups(available).map((group) => group.filter((product) => !chosen.has(product.id)));
  for (let round = 0; picked.length < limit; round++) {
    const before = picked.length;
    for (const group of groups) {
      if (picked.length >= limit) break;
      const next = group[round];
      if (next) { picked.push(next); chosen.add(next.id); }
    }
    if (picked.length === before) break;
  }
  available.filter((product) => !chosen.has(product.id)).sort((a, b) => catalogOrder(a) - catalogOrder(b))
    .slice(0, Math.max(0, limit - picked.length))
    .forEach((product) => picked.push(product));
  return picked;
}
