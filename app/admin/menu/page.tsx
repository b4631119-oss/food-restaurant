"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductRow } from "@/components/admin/product-row";
import { ProductForm } from "@/components/admin/product-form";
import { AdminToast } from "@/components/admin/toast";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DEMO_DATA_EVENT, getCategories, getProducts, removeProduct, restoreProduct, setProducts, type DemoProduct } from "@/lib/demo-store";
import { importMenuIfEmpty } from "@/lib/repo/products-repo";

export default function AdminMenuPage() {
  const [products, setList] = useState<DemoProduct[]>([]); const [categories, setCategoryList] = useState<string[]>([]);
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("Все");
  const [editing, setEditing] = useState<DemoProduct | null | false>(false); const [removing, setRemoving] = useState<DemoProduct | null>(null);
  const [toast, setToast] = useState(""); const [undo, setUndo] = useState<DemoProduct | null>(null); const [error, setError] = useState("");
  const [importing, setImporting] = useState(false); const [importMessage, setImportMessage] = useState("");
  useEffect(() => { const refresh = () => { setList(getProducts()); setCategoryList(getCategories()); }; const timer = window.setTimeout(refresh, 0); window.addEventListener(DEMO_DATA_EVENT, refresh); return () => { window.clearTimeout(timer); window.removeEventListener(DEMO_DATA_EVENT, refresh); }; }, []);
  const visible = useMemo(() => products.filter((product) => (category === "Все" || product.category === category) && `${product.name} ${product.description}`.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru"))), [products, category, query]);
  async function importMenu() { setImporting(true); setImportMessage(""); try { const result = await importMenuIfEmpty(); setImportMessage(result.products || result.categories ? "Пустые коллекции заполнены из menu.json." : "В Firebase уже есть меню."); } catch (e) { setError(e instanceof Error ? e.message : "Не удалось загрузить меню в Firebase."); } finally { setImporting(false); } }
  function save(product: DemoProduct) { try { const next = products.some((item) => item.id === product.id) ? products.map((item) => item.id === product.id ? product : item) : [...products, product]; setProducts(next); setList(next); setEditing(false); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить блюдо."); } }
  function toggle(product: DemoProduct) { save({ ...product, inStock: !product.inStock }); }
  function copy(product: DemoProduct) { setEditing({ ...product, id: crypto.randomUUID(), name: `${product.name} (копия)` }); }
  function remove() { if (!removing) return; try { removeProduct(removing); setList(getProducts()); setUndo(removing); setToast(`«${removing.name}» удалено`); window.setTimeout(() => setUndo(null), 5000); } catch (e) { setError(e instanceof Error ? e.message : "Не удалось удалить блюдо."); } setRemoving(null); }
  return <section><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Меню</h1><p className="mt-1 text-sm text-muted">Блюд: {products.length}</p></div><div className="flex flex-wrap gap-2"><button onClick={importMenu} disabled={importing} className="min-h-11 rounded-lg border border-line px-3 text-sm disabled:opacity-50">{importing ? "Загрузка…" : "Загрузить меню из menu.json в Firebase"}</button><button onClick={() => setEditing(null)} className="min-h-11 rounded-lg bg-accent px-4 font-bold text-background">+ Добавить блюдо</button></div></div>{importMessage && <p role="status" className="mt-3 text-sm text-muted">{importMessage}</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск блюда" className="h-[52px] rounded-lg border border-line bg-surface px-3 outline-none focus:border-accent" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="h-[52px] rounded-lg border border-line bg-surface px-3"><option>Все</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}{visible.length ? <div className="mt-4 grid gap-2">{visible.map((product) => <ProductRow key={product.id} product={product} onToggle={() => toggle(product)} onEdit={() => setEditing(product)} onCopy={() => copy(product)} onDelete={() => setRemoving(product)} />)}</div> : <p className="mt-8 rounded-xl border border-line bg-surface p-6 text-center text-muted">Блюд не найдено</p>}
    {editing !== false && <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 sm:grid sm:place-items-center sm:bg-black/70"><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold">{editing ? "Изменить блюдо" : "Добавить блюдо"}</h2><ProductForm product={editing || undefined} onSave={save} onCancel={() => setEditing(false)} /></div></div>}
    <ConfirmDialog open={Boolean(removing)} title="Удалить блюдо?" message={`Удалить «${removing?.name ?? ""}» из демо-меню?`} onCancel={() => setRemoving(null)} onConfirm={remove} />
    {toast && <AdminToast message={toast} actionLabel={undo ? "Отменить" : undefined} onAction={() => { if (undo) restoreProduct(undo); setList(getProducts()); setUndo(null); setToast(""); }} onDismiss={() => setToast("")} />}
  </section>;
}
