"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { watchCategories } from "@/lib/repo/categories-repo";
import { saveProduct } from "@/lib/repo/products-repo";
import type { DemoProduct } from "@/lib/models";
import { compressImage } from "@/lib/image-compress";

type Props = { product?: DemoProduct; onSave: (product: DemoProduct) => void; onCancel: () => void };
export function ProductForm({ product, onSave, onCancel }: Props) {
  const first = useRef<HTMLInputElement>(null); const [categories, setCategories] = useState<string[]>([]);
  const [name, setName] = useState(product?.name ?? ""); const [description, setDescription] = useState(product?.description ?? "");
  const [weight, setWeight] = useState(product?.weight ?? ""); const [price, setPrice] = useState(String(product?.price ?? ""));
  const [category, setCategory] = useState(product?.category ?? ""); const [popular, setPopular] = useState(Boolean(product?.popular));
  const [inStock, setInStock] = useState(product?.inStock ?? true); const [image, setImage] = useState(product?.image ?? "");
  const [imageError, setImageError] = useState(""); const [errors, setErrors] = useState({ name: "", price: "", category: "" });
  useEffect(() => { first.current?.focus(); return watchCategories(setCategories); }, []);
  async function upload(file?: File) {
    if (!file) return;
    try { setImage(await compressImage(file)); setImageError(""); }
    catch (error) { setImageError(error instanceof globalThis.Error ? error.message : "Ошибка изображения."); }
  }
  function submit(event: FormEvent) {
    event.preventDefault(); const next = { name: name.trim().length < 2 ? "Введите минимум 2 символа." : "", price: Number(price) <= 0 ? "Цена должна быть больше нуля." : "", category: category ? "" : "Выберите категорию." };
    setErrors(next); if (next.name || next.price || next.category) return;
    const saved = { ...(product ?? { id: crypto.randomUUID() }), name: name.trim(), description: description.trim(), weight, price: Number(price), category, popular, inStock, image };
    void saveProduct(saved).then(() => onSave(saved)).catch((error: unknown) => setImageError(error instanceof Error ? error.message : "Не удалось сохранить блюдо."));
  }
  const field = "mt-1 h-[52px] w-full rounded-lg border border-line bg-background px-3 text-base outline-none focus:border-accent";
  return <form onSubmit={submit} className="space-y-3"><label className="block text-sm">Название<input ref={first} value={name} onChange={(e) => setName(e.target.value)} className={field} />{errors.name && <FieldError>{errors.name}</FieldError>}</label>
    <label className="block text-sm">Описание<textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${field} h-24 py-3`} /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">Вес<input value={weight} onChange={(e) => setWeight(e.target.value)} className={field} /></label><label className="text-sm">Цена<input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className={field} />{errors.price && <FieldError>{errors.price}</FieldError>}</label></div>
    <label className="block text-sm">Категория<select value={category} onChange={(e) => setCategory(e.target.value)} className={field}><option value="">Выберите</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>{errors.category && <FieldError>{errors.category}</FieldError>}</label>
    <div className="flex flex-wrap gap-4 text-sm"><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} />Популярное</label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />В наличии</label></div>
    <label className="block text-sm">Ссылка на фото<input value={image.startsWith("data:") ? "" : image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" className={field} /></label><label className="block text-sm">Загрузить фото<input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} className="mt-2 block min-h-11 w-full text-sm" /></label>{imageError && <FieldError>{imageError}</FieldError>}{image && <Preview src={image} />}
    <div className="flex gap-3 pt-2"><button type="button" onClick={onCancel} className="min-h-12 flex-1 rounded-lg border border-line">Отмена</button><button className="min-h-12 flex-1 rounded-lg bg-accent font-bold text-background">Сохранить</button></div></form>;
}
function Preview({ src }: { src: string }) {
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Предпросмотр блюда" className="h-32 w-32 rounded-xl object-cover" />
    </div>
  );
}
function FieldError({ children }: { children: string }) { return <span className="mt-1 block text-sm text-red-400">{children}</span>; }
