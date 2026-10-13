"use client";

import { useRef, useState } from "react";
import { ImageOff, Minus, Plus, X } from "lucide-react";
import { cloudImage } from "@/lib/cloudinary";
import { money, portionInfo } from "@/lib/format";
import { useModalBackHandler, useScrollLock } from "@/hooks/use-scroll-lock";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { Product } from "@/lib/types";

type ProductSheetProps = {
  product: Product;
  quantity: number;
  onAdd: (productId: string) => void;
  onChange: (productId: string, amount: number) => void;
  onClose: () => void;
};

// Окно блюда: на телефоне выезжает снизу, от 640px — по центру.
// Корзину не дублирует: добавление и количество приходят пропсами как у карточки.
export function ProductSheet({ product, quantity, onAdd, onChange, onClose }: ProductSheetProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  useScrollLock(true);
  useModalBackHandler(true, onClose);
  useFocusTrap(panelRef, onClose);
  const portion = portionInfo(product);
  const showImage = Boolean(product.image) && !imageFailed;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center sm:p-5"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={panelRef}
        data-dish-sheet=""
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        className="dish-sheet-enter flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-panel shadow-2xl outline-none sm:max-w-md sm:rounded-3xl"
      >
        <header className="relative flex h-14 shrink-0 items-center justify-center px-4">
          <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-line sm:hidden" />
          <button type="button" onClick={onClose} aria-label="Закрыть" className="press absolute right-3 grid size-11 place-items-center rounded-full text-muted hover:bg-surface hover:text-text"><X className="size-5" aria-hidden="true" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="aspect-[4/3] w-full overflow-hidden bg-surface">
            {showImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={cloudImage(product.image, 800)} alt={product.name} width={800} height={600} loading="lazy" decoding="async" className="size-full object-cover" onError={() => setImageFailed(true)} />
            ) : (
              <div className="grid size-full place-items-center text-muted" aria-hidden="true"><ImageOff className="size-10" /></div>
            )}
          </div>
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <h2 id="dish-title" className="text-[22px] font-bold leading-7 [overflow-wrap:anywhere]">{product.name}</h2>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              {portion && <p className="text-sm text-muted [overflow-wrap:anywhere]">{portion}</p>}
              <p className="shrink-0 text-xl font-bold text-accent">{money(product.price)}</p>
            </div>
            {product.description && (
              <div className="space-y-1.5 border-t border-line pt-3">
                <h3 className="text-base font-bold">Состав</h3>
                <p className="whitespace-pre-line text-base leading-6 text-text [overflow-wrap:anywhere]">{product.description}</p>
              </div>
            )}
            <p className="text-[13px] leading-5 text-muted">Есть аллергия? Напишите об этом в комментарии к заказу.</p>
          </div>
        </div>
        <div className="safe-bottom shrink-0 border-t border-line bg-panel px-4 pt-3">
          {quantity > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-background/50 p-0.5">
                <button type="button" onClick={() => onChange(product.id, -1)} aria-label={`Убрать один: ${product.name}`} className="press grid size-12 shrink-0 place-items-center rounded-full text-muted hover:text-text"><Minus className="size-5" aria-hidden="true" /></button>
                <span className="min-w-6 text-center text-base font-bold text-accent">{quantity}</span>
                <button type="button" onClick={() => onAdd(product.id)} aria-label={`Добавить один: ${product.name}`} className="press grid size-12 shrink-0 place-items-center rounded-full bg-accent text-background hover:bg-accent-hover"><Plus className="size-5" aria-hidden="true" /></button>
              </div>
              <span className="min-w-0 truncate text-lg font-bold text-accent">{money(product.price * quantity)}</span>
            </div>
          ) : (
            <button type="button" onClick={() => onAdd(product.id)} className="press accent-shadow flex h-[52px] w-full items-center justify-center rounded-xl bg-accent text-base font-bold text-background hover:bg-accent-hover">Добавить · {money(product.price)}</button>
          )}
        </div>
      </section>
    </div>
  );
}
