"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductRow } from "@/components/admin/product-row";
import { ProductForm } from "@/components/admin/product-form";
import { AdminToast } from "@/components/admin/toast";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ImportDialog } from "@/components/admin/import-dialog";
import { useModalBackHandler } from "@/hooks/use-scroll-lock";
import { deleteProduct, getProducts, saveProduct } from "@/lib/repo/products-repo";
import { getCategories } from "@/lib/repo/categories-repo";
import { ensureMenuPublished, republishMenu, subscribePublishStatus, type PublishStatus } from "@/lib/repo/menu-repo";
import type { DemoProduct } from "@/lib/models";

export default function AdminMenuPage() {
  const [products, setProducts] = useState<DemoProduct[]>([]); const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); const [menuError, setMenuError] = useState("");
  // Меню читается один раз при открытии страницы: подписка на коллекции множила чтения Firestore.
  // После каждой правки список обновляется вручную функцией reload().
  const reload = useCallback(async () => {
    try {
      const [items, names] = await Promise.all([getProducts(), getCategories()]);
      setProducts(items); setCategories(names); setMenuError("");
    } catch { setMenuError("Не удалось загрузить меню."); }
    setLoading(false);
  }, []);
  useEffect(() => { void Promise.resolve().then(reload); }, [reload]);
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("Все");
  const [editing, setEditing] = useState<DemoProduct | null | false>(false); const [removing, setRemoving] = useState<DemoProduct | null>(null);
  const [toast, setToast] = useState(""); const [undo, setUndo] = useState<DemoProduct | null>(null); const [error, setError] = useState(""); const [publishing, setPublishing] = useState(false);
  const [importOpen, setImportOpen] = useState(false); const [confirmPhotos, setConfirmPhotos] = useState(false);
  // Статус публикации показывается строкой под заголовком: админ видит, что меню уже на сайте
  // (публикация идёт автоматически после каждой правки) или что её нужно повторить кнопкой.
  const [publishStatus, setPublishStatus] = useState<PublishStatus>({ state: "idle", at: null, detail: "" });
  useEffect(() => subscribePublishStatus(setPublishStatus), []);
  // Открытие админки догоняет публикацию, потерянную при закрытой вкладке.
  useEffect(() => { ensureMenuPublished(); }, []);
  useModalBackHandler(editing !== false, () => setEditing(false));
  useModalBackHandler(importOpen, () => setImportOpen(false));
  const embedded = products.filter((product) => product.image.startsWith("data:"));
  // Снимок витрины (menu/public) собирается здесь по кнопке и автоматически после правок.
  async function publish() { setPublishing(true); try { const result = await republishMenu(); setError(""); setToast(`Опубликовано: ${result.products} блюд, ${result.categories} категорий`); } catch { /* Причина уже видна в строке статуса публикации. */ } finally { setPublishing(false); } }
  async function toggleStock(product: DemoProduct) { try { await saveProduct({ ...product, inStock: !product.inStock }); await reload(); } catch { setError("Не удалось переключить наличие блюда."); } }
  async function clearEmbedded() { const targets = embedded; try { await Promise.all(targets.map((product) => saveProduct({ ...product, image: "" }))); await reload(); setToast(`Очищено встроенных фото: ${targets.length}`); } catch { setError("Не удалось очистить встроенные фото."); } }
  const visible = useMemo(() => products.filter((product) => (category === "Все" || product.category === category) && `${product.name} ${product.description}`.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru"))), [products, category, query]);
  async function remove() { if (!removing) return; try { await deleteProduct(removing.id); await reload(); setUndo(removing); setToast(`«${removing.name}» удалено`); } catch { setError("Не удалось удалить блюдо."); } setRemoving(null); }
  async function restore() { if (!undo) return; try { await saveProduct(undo); await reload(); } catch { setError("Не удалось вернуть блюдо."); } setUndo(null); setToast(""); }
  return <section><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Меню</h1><p className="mt-1 text-sm text-muted">Блюд: {products.length}</p><p role={publishStatus.state === "error" ? "alert" : undefined} className={`mt-1 max-w-md text-xs ${publishStatus.state === "error" ? "text-red-400" : "text-muted"}`}>{publishHint(publishStatus)}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setImportOpen(true)} className="min-h-11 rounded-lg border border-line px-3 text-sm">Импорт из файла</button>{embedded.length > 0 && <button onClick={() => setConfirmPhotos(true)} className="min-h-11 rounded-lg border border-red-500/40 px-3 text-sm text-red-400">Очистить встроенные фото ({embedded.length})</button>}<button onClick={() => void publish()} disabled={publishing} className="min-h-11 rounded-lg border border-accent/50 px-3 text-sm font-semibold text-accent disabled:opacity-50">{publishing ? "Публикуем…" : "Опубликовать меню на сайте"}</button><button onClick={() => setEditing(null)} className="min-h-11 rounded-lg bg-accent px-4 font-bold text-background">+ Добавить блюдо</button></div></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск блюда" className="h-[52px] rounded-lg border border-line bg-surface px-3 text-base outline-none focus:border-accent" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="h-[52px] rounded-lg border border-line bg-surface px-3 text-base"><option>Все</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
    {(error || menuError) && <p role="alert" className="mt-3 text-sm text-red-400">{error || menuError}</p>}{loading ? <div className="mt-4 space-y-2">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-surface" />)}</div> : visible.length ? <div className="mt-4 grid gap-2">{visible.map((product) => <ProductRow key={product.id} product={product} onToggle={() => void toggleStock(product)} onEdit={() => setEditing(product)} onCopy={() => setEditing({ ...product, id: crypto.randomUUID(), name: `${product.name} (копия)` })} onDelete={() => setRemoving(product)} />)}</div> : <p className="mt-8 rounded-xl border border-line bg-surface p-6 text-center text-muted">Блюд не найдено</p>}
    {editing !== false && <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 sm:grid sm:place-items-center sm:bg-black/70"><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold">{editing ? "Изменить блюдо" : "Добавить блюдо"}</h2><ProductForm product={editing || undefined} onSave={() => { setEditing(false); void reload(); }} onCancel={() => setEditing(false)} /></div></div>}
    {importOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 sm:grid sm:place-items-center sm:bg-black/70"><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold">Импорт меню из файла</h2><ImportDialog onClose={(message) => { setImportOpen(false); if (message) { setToast(message); void reload(); } }} /></div></div>}
    <ConfirmDialog open={Boolean(removing)} title="Удалить блюдо?" message={`Удалить «${removing?.name ?? ""}» из меню?`} onCancel={() => setRemoving(null)} onConfirm={() => void remove()} />
    <ConfirmDialog open={confirmPhotos} title="Очистить встроенные фото?" confirmLabel="Очистить" message={`У ${embedded.length} блюд встроенное фото будет заменено пустым — карточка покажет заглушку.`} onCancel={() => setConfirmPhotos(false)} onConfirm={() => { setConfirmPhotos(false); void clearEmbedded(); }} />
    {toast && <AdminToast message={toast} actionLabel={undo ? "Отменить" : undefined} onAction={() => void restore()} onDismiss={() => { setUndo(null); setToast(""); }} />}
  </section>;
}

// Что видит админ про публикацию: сохранение уже запустило её, кнопка нужна для повтора.
function publishHint(status: PublishStatus): string {
  if (status.state === "pending") return "Публикуем меню на сайте…";
  if (status.state === "error") return `Меню на сайте не обновилось: ${status.detail} Нажмите «Опубликовать меню на сайте».`;
  if (status.state === "ok") return `На сайте меню из ${status.detail}. Правки публикуются автоматически через пару секунд после сохранения.`;
  return "Правки публикуются на сайт автоматически после сохранения; кнопка ниже — для повторной публикации.";
}
