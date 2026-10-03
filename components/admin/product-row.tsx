"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import type { DemoProduct } from "@/lib/models";

type Props = { product: DemoProduct; onToggle: () => void; onEdit: () => void; onCopy: () => void; onDelete: () => void };
export function ProductRow({ product, onToggle, onEdit, onCopy, onDelete }: Props) {
  return <article className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface p-3">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={product.image || "/images/favicon.jpg"} alt="" className="size-16 shrink-0 rounded-lg bg-background object-cover" />
    <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{product.name}</h2><p className="mt-1 text-sm text-accent">{product.price} сом</p><label className="mt-2 flex min-h-11 items-center gap-2 text-xs text-muted"><input type="checkbox" checked={product.inStock} onChange={onToggle} />В наличии</label></div>
    <div className="grid grid-cols-2 gap-1"><button onClick={onEdit} aria-label="Изменить" className="grid size-11 place-items-center rounded-lg border border-line"><Pencil size={17} /></button><button onClick={onCopy} aria-label="Копировать" className="grid size-11 place-items-center rounded-lg border border-line"><Copy size={17} /></button><button onClick={onDelete} aria-label="Удалить" className="col-span-2 grid min-h-11 place-items-center rounded-lg border border-line text-red-400"><Trash2 size={17} /></button></div>
  </article>;
}
