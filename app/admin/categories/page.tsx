"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DEMO_DATA_EVENT, getCategories, getProducts, setCategories, setProducts, type DemoProduct } from "@/lib/demo-store";

export default function CategoriesPage() {
  const [categories, setList] = useState<string[]>([]); const [products, setProductsState] = useState<DemoProduct[]>([]);
  const [name, setName] = useState(""); const [rename, setRename] = useState<string | null>(null); const [remove, setRemove] = useState<string | null>(null);
  const [target, setTarget] = useState(""); const [error, setError] = useState(""); const [confirmEmpty, setConfirmEmpty] = useState(false);
  useEffect(() => { const refresh = () => { setList(getCategories()); setProductsState(getProducts()); }; const timer = window.setTimeout(refresh, 0); window.addEventListener(DEMO_DATA_EVENT, refresh); return () => { window.clearTimeout(timer); window.removeEventListener(DEMO_DATA_EVENT, refresh); }; }, []);
  function persist(next: string[]) { try { setCategories(next); setList(next); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить категории."); } }
  function add() { const value = name.trim(); if (value && !categories.includes(value)) persist([...categories, value]); setName(""); }
  function saveRename() { if (!rename || !name.trim() || categories.includes(name.trim())) return; const nextName = name.trim(); const updated = categories.map((item) => item === rename ? nextName : item); try { setProducts(products.map((p) => p.category === rename ? { ...p, category: nextName } : p)); setCategories(updated); setList(updated); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить категорию."); } setRename(null); setName(""); }
  function move(delta: number, index: number) { const next = [...categories]; const other = index + delta; if (other < 0 || other >= next.length) return; const current = next[index]; next[index] = next[other]; next[other] = current; persist(next); }
  function confirmDelete() {
    if (!remove) return;
    const remaining = categories.filter((item) => item !== remove);
    try { setProducts(products.map((p) => p.category === remove ? { ...p, category: target } : p)); setCategories(remaining); setList(remaining); setError(""); setRemove(null); setTarget(""); setConfirmEmpty(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось удалить категорию."); }
  }
  const count = (item: string) => products.filter((p) => p.category === item).length;
  return <section><h1 className="text-2xl font-bold">Категории</h1><form onSubmit={(e) => { e.preventDefault(); if (rename) saveRename(); else add(); }} className="mt-4 flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={rename ? "Новое название" : "Новая категория"} className="h-[52px] min-w-0 flex-1 rounded-lg border border-line bg-surface px-3" /><button className="min-h-12 rounded-lg bg-accent px-4 font-bold text-background">{rename ? "Сохранить" : "Добавить категорию"}</button></form>
    {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
    <div className="mt-4 space-y-2">{categories.map((item, index) => { const locked = ["Популярное", "Все"].includes(item); return <article key={item} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3"><span className="min-w-0 flex-1 font-semibold">{item} <small className="text-muted">{count(item)} блюд</small></span><button disabled={locked || index === 0} onClick={() => move(-1, index)} className="min-h-11 rounded-lg border border-line px-3 disabled:opacity-40">↑</button><button disabled={locked || index === categories.length - 1} onClick={() => move(1, index)} className="min-h-11 rounded-lg border border-line px-3 disabled:opacity-40">↓</button><button disabled={locked} onClick={() => { setRename(item); setName(item); }} className="min-h-11 rounded-lg border border-line px-3 disabled:opacity-40">Переименовать</button><button disabled={locked} onClick={() => { setRemove(item); setTarget(categories.find((c) => c !== item && !["Популярное", "Все"].includes(c)) ?? ""); setConfirmEmpty(count(item) === 0); }} className="min-h-11 rounded-lg border border-line px-3 text-red-400 disabled:opacity-40">Удалить</button></article>; })}</div>
    {remove && !confirmEmpty && <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4"><div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5"><p className="mb-4 text-sm text-muted">В категории {count(remove)} блюд. Выберите, куда их переместить.</p><label className="text-sm">Переместить блюда в<select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-2 h-[52px] w-full rounded-lg border border-line bg-background px-3">{categories.filter((c) => c !== remove && !["Популярное", "Все"].includes(c)).map((c) => <option key={c}>{c}</option>)}</select></label><button onClick={confirmDelete} disabled={!target} className="mt-4 min-h-12 w-full rounded-lg bg-red-600 font-bold text-white disabled:opacity-40">Переместить и удалить</button><button onClick={() => setRemove(null)} className="mt-2 min-h-11 w-full text-sm">Отмена</button></div></div>}
    <ConfirmDialog open={Boolean(remove) && confirmEmpty} title="Удалить категорию?" message="В категории нет блюд. Категория будет удалена." onCancel={() => setRemove(null)} onConfirm={confirmDelete} />
  </section>;
}
