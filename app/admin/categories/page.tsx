"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Edit2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useModalBackHandler } from "@/hooks/use-scroll-lock";
import { getCategories, saveCategories } from "@/lib/repo/categories-repo";
import { getProducts, saveProduct } from "@/lib/repo/products-repo";
import { ensureMenuPublished } from "@/lib/repo/menu-repo";
import type { DemoProduct } from "@/lib/models";

export default function CategoriesPage() {
  
  const [categories, setList] = useState<string[]>([]); const [products, setProductsState] = useState<DemoProduct[]>([]);
  const [name, setName] = useState(""); const [rename, setRename] = useState<string | null>(null); const [remove, setRemove] = useState<string | null>(null);
  const [target, setTarget] = useState(""); const [error, setError] = useState(""); const [confirmEmpty, setConfirmEmpty] = useState(false);
  useModalBackHandler(Boolean(remove && !confirmEmpty), () => setRemove(null));
  // Категории и блюда читаются один раз при открытии: подписки на коллекции множили чтения Firestore.
  const reload = useCallback(async () => {
    try { const [names, items] = await Promise.all([getCategories(), getProducts()]); setList(names); setProductsState(items); setError(""); }
    catch { setError("Не удалось загрузить категории."); }
  }, []);
  useEffect(() => { void Promise.resolve().then(reload); }, [reload]);
  // Открытие админки догоняет публикацию, потерянную при закрытой вкладке.
  useEffect(() => { ensureMenuPublished(); }, []);
  // Ошибка сохранения показывается, а введённое имя остаётся — так категорию можно добавить повторно.
  async function persist(next: string[]): Promise<boolean> { try { await saveCategories(next); await reload(); setError(""); return true; } catch { setError("Не удалось сохранить категории в Firebase."); return false; } }
  async function add() { const value = name.trim(); if (!value || categories.includes(value)) return; if (await persist([...categories, value])) setName(""); }
  async function renameCategory() { if (!rename || !name.trim() || categories.includes(name.trim())) return; const nextName = name.trim(); try { await Promise.all(products.filter((item) => item.category === rename).map((item) => saveProduct({ ...item, category: nextName }))); await persist(categories.map((item) => item === rename ? nextName : item)); } catch { setError("Не удалось переименовать категорию."); } setRename(null); setName(""); }
  async function move(delta: number, index: number) { const next = [...categories]; const other = index + delta; if (other < 0 || other >= next.length) return; [next[index], next[other]] = [next[other], next[index]]; await persist(next); }
  async function confirmDelete() { if (!remove) return; try { await Promise.all(products.filter((item) => item.category === remove).map((item) => saveProduct({ ...item, category: target }))); await persist(categories.filter((item) => item !== remove)); } catch { setError("Не удалось удалить категорию."); } setRemove(null); setTarget(""); setConfirmEmpty(false); }
  const count = (item: string) => products.filter((product) => product.category === item).length;
  return <section><h1 className="text-2xl font-bold">Категории</h1>
    <form onSubmit={(event) => { event.preventDefault(); void (rename ? renameCategory() : add()); }} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder={rename ? "Новое название" : "Новая категория"} className="h-[52px] min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-base" />
      <button className="min-h-12 rounded-lg bg-accent px-5 font-bold text-background">{rename ? "Сохранить" : "Добавить категорию"}</button>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
    <div className="mt-4 space-y-2.5">
      {categories.map((item, index) => {
        const locked = ["Популярное", "Все"].includes(item);
        return <article key={item} className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-base font-bold text-text">{item}</h2>
            <span className="text-xs text-muted">{count(item)} блюд в меню</span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
            <button disabled={locked || index === 0} onClick={() => void move(-1, index)} aria-label={`Переместить выше ${item}`} className="press grid size-11 place-items-center rounded-lg border border-line text-muted hover:text-text disabled:opacity-30"><ArrowUp size={16} /></button>
            <button disabled={locked || index === categories.length - 1} onClick={() => void move(1, index)} aria-label={`Переместить ниже ${item}`} className="press grid size-11 place-items-center rounded-lg border border-line text-muted hover:text-text disabled:opacity-30"><ArrowDown size={16} /></button>
            <button disabled={locked} onClick={() => { setRename(item); setName(item); }} aria-label={`Переименовать ${item}`} className="press inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold hover:border-accent disabled:opacity-30"><Edit2 size={14} /><span className="hidden xs:inline">Имя</span></button>
            <button disabled={locked} onClick={() => { setRemove(item); setTarget(categories.find((category) => category !== item && !["Популярное", "Все"].includes(category)) ?? ""); setConfirmEmpty(count(item) === 0); }} aria-label={`Удалить ${item}`} className="press inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-red-400 hover:border-red-400/50 disabled:opacity-30"><Trash2 size={14} /><span className="hidden xs:inline">Удалить</span></button>
          </div>
        </article>;
      })}
    </div>
    {remove && !confirmEmpty && <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4"><div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5"><p className="mb-4 text-sm text-muted">В категории {count(remove)} блюд. Выберите, куда их переместить.</p><label className="text-sm">Переместить блюда в<select value={target} onChange={(event) => setTarget(event.target.value)} className="mt-2 h-[52px] w-full rounded-lg border border-line bg-background px-3 text-base">{categories.filter((category) => category !== remove && !["Популярное", "Все"].includes(category)).map((category) => <option key={category}>{category}</option>)}</select></label><button onClick={() => void confirmDelete()} disabled={!target} className="mt-4 min-h-12 w-full rounded-lg bg-red-600 font-bold text-white disabled:opacity-40">Переместить и удалить</button><button onClick={() => setRemove(null)} className="mt-2 min-h-11 w-full text-sm">Отмена</button></div></div>}
    <ConfirmDialog open={Boolean(remove) && confirmEmpty} title="Удалить категорию?" message="В категории нет блюд. Категория будет удалена." onCancel={() => setRemove(null)} onConfirm={() => void confirmDelete()} />
  </section>;
}
