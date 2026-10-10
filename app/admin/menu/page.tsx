"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductRow } from "@/components/admin/product-row";
import { ProductForm } from "@/components/admin/product-form";
import { AdminToast } from "@/components/admin/toast";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ImportDialog } from "@/components/admin/import-dialog";
import { useModalBackHandler } from "@/hooks/use-scroll-lock";
import { deleteProduct, saveProduct, watchProducts } from "@/lib/repo/products-repo";
import { watchCategories } from "@/lib/repo/categories-repo";
import type { DemoProduct } from "@/lib/models";

export default function AdminMenuPage() {
  const [products, setProducts] = useState<DemoProduct[]>([]); const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); const [menuError, setMenuError] = useState("");
  useEffect(() => {
    const stopProducts = watchProducts((items) => { setProducts(items); setLoading(false); }, () => { setLoading(false); setMenuError("Не удалось загрузить меню."); });
    const stopCategories = watchCategories(setCategories);
    return () => { stopProducts(); stopCategories(); };
  }, []);
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("Все");
  const [editing, setEditing] = useState<DemoProduct | null | false>(false); const [removing, setRemoving] = useState<DemoProduct | null>(null);
  const [toast, setToast] = useState(""); const [undo, setUndo] = useState<DemoProduct | null>(null); const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false); const [confirmPhotos, setConfirmPhotos] = useState(false);
  useModalBackHandler(editing !== false, () => setEditing(false));
  useModalBackHandler(importOpen, () => setImportOpen(false));
  const embedded = products.filter((product) => product.image.startsWith("data:"));
  async function clearEmbedded() { const targets = embedded; try { await Promise.all(targets.map((product) => saveProduct({ ...product, image: "" }))); setToast(`Очищено встроенных фото: ${targets.length}`); } catch { setError("Не удалось очистить встроенные фото."); } }
  const visible = useMemo(() => products.filter((product) => (category === "Все" || product.category === category) && `${product.name} ${product.description}`.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru"))), [products, category, query]);
  async function remove() { if (!removing) return; try { await deleteProduct(removing.id); setUndo(removing); setToast(`«${removing.name}» удалено`); } catch { setError("Не удалось удалить блюдо."); } setRemoving(null); }
  return <section><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Меню</h1><p className="mt-1 text-sm text-muted">Блюд: {products.length}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setImportOpen(true)} className="min-h-11 rounded-lg border border-line px-3 text-sm">Импорт из файла</button>{embedded.length > 0 && <button onClick={() => setConfirmPhotos(true)} className="min-h-11 rounded-lg border border-red-500/40 px-3 text-sm text-red-400">Очистить встроенные фото ({embedded.length})</button>}<button onClick={() => setEditing(null)} className="min-h-11 rounded-lg bg-accent px-4 font-bold text-background">+ Добавить блюдо</button></div></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск блюда" className="h-[52px] rounded-lg border border-line bg-surface px-3 text-base outline-none focus:border-accent" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="h-[52px] rounded-lg border border-line bg-surface px-3 text-base"><option>Все</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
    {(error || menuError) && <p role="alert" className="mt-3 text-sm text-red-400">{error || menuError}</p>}{loading ? <div className="mt-4 space-y-2">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-surface" />)}</div> : visible.length ? <div className="mt-4 grid gap-2">{visible.map((product) => <ProductRow key={product.id} product={product} onToggle={() => void import("@/lib/repo/products-repo").then(({ saveProduct }) => saveProduct({ ...product, inStock: !product.inStock }))} onEdit={() => setEditing(product)} onCopy={() => setEditing({ ...product, id: crypto.randomUUID(), name: `${product.name} (копия)` })} onDelete={() => setRemoving(product)} />)}</div> : <p className="mt-8 rounded-xl border border-line bg-surface p-6 text-center text-muted">Блюд не найдено</p>}
    {editing !== false && <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 sm:grid sm:place-items-center sm:bg-black/70"><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold">{editing ? "Изменить блюдо" : "Добавить блюдо"}</h2><ProductForm product={editing || undefined} onSave={() => setEditing(false)} onCancel={() => setEditing(false)} /></div></div>}
    {importOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 sm:grid sm:place-items-center sm:bg-black/70"><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold">Импорт меню из файла</h2><ImportDialog onClose={(message) => { setImportOpen(false); if (message) setToast(message); }} /></div></div>}
    <ConfirmDialog open={Boolean(removing)} title="Удалить блюдо?" message={`Удалить «${removing?.name ?? ""}» из меню?`} onCancel={() => setRemoving(null)} onConfirm={() => void remove()} />
    <ConfirmDialog open={confirmPhotos} title="Очистить встроенные фото?" confirmLabel="Очистить" message={`У ${embedded.length} блюд встроенное фото будет заменено пустым — карточка покажет заглушку.`} onCancel={() => setConfirmPhotos(false)} onConfirm={() => { setConfirmPhotos(false); void clearEmbedded(); }} />
    {toast && <AdminToast message={toast} actionLabel={undo ? "Отменить" : undefined} onAction={() => { if (undo) void import("@/lib/repo/products-repo").then(({ saveProduct }) => saveProduct(undo)); setUndo(null); setToast(""); }} onDismiss={() => setToast("")} />}
  </section>;
}
