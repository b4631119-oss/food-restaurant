import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { bumpSyncVersion } from "@/lib/repo/settings-repo";
import { scheduleMenuPublish } from "@/lib/repo/menu-repo";

const categories = collection(db, "categories");

// Имя категории нельзя использовать как id документа: имена из каталога содержат "/" (например,
// «тез татым / шаурмалар»), а Firestore принимает в id документа только один сегмент пути. Раньше
// такая запись падала с invalid-argument ещё до commit, поэтому не сохранялась НИ ОДНА категория.
// id выводится детерминированно из имени (одно имя — один id, порядок и повторные сохранения
// ничего не пересоздают), а у существующих документов прежний id сохраняется.
function stableId(name: string): string {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) { hash ^= name.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `category-${(hash >>> 0).toString(36)}`;
}
// Добавляет id в taken, чтобы новый документ не перезаписал существующий (в том числе удаляемый).
export function categoryId(name: string, taken: Set<string>): string {
  const base = stableId(name);
  let id = base; let suffix = 2;
  while (taken.has(id)) { id = `${base}-${suffix}`; suffix += 1; }
  taken.add(id);
  return id;
}

export async function getCategories(): Promise<string[]> {
  const snapshot = await getDocs(categories);
  return snapshot.docs.map((item) => ({ id: item.id, name: String(item.data().name ?? item.id), order: Number(item.data().order ?? 0) })).sort((a, b) => a.order - b.order).map((item) => item.name);
}
export async function saveCategories(names: string[]): Promise<void> {
  const unique = [...new Set(names)];
  const existing = await getDocs(categories);
  const idsByName = new Map(existing.docs.map((item) => [String(item.data().name ?? item.id), item.id]));
  const taken = new Set(existing.docs.map((item) => item.id));
  const keep = new Set<string>();
  const batch = writeBatch(db);
  unique.forEach((name, order) => {
    const id = idsByName.get(name) ?? categoryId(name, taken);
    keep.add(id);
    batch.set(doc(db, "categories", id), { name, order });
  });
  // Удаляются только документы, чьих имён больше нет: переименование и переупорядочивание
  // не трогают лишних документов.
  existing.docs.forEach((item) => { if (!keep.has(item.id)) batch.delete(item.ref); });
  await batch.commit();
  await bumpSyncVersion();
  scheduleMenuPublish();
}
