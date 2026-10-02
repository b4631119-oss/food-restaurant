"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ConfirmDialogProps = { open: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void };
export function ConfirmDialog({ open, title, message, confirmLabel = "Удалить", onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [open, onCancel]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="confirm-title" className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-muted">{message}</p></div><button onClick={onCancel} aria-label="Закрыть" className="grid size-11 shrink-0 place-items-center text-muted"><X size={20} /></button></div><div className="mt-6 flex gap-3"><button onClick={onCancel} className="min-h-12 flex-1 rounded-lg border border-line px-4 font-semibold">Отмена</button><button onClick={onConfirm} className="min-h-12 flex-1 rounded-lg bg-red-600 px-4 font-bold text-white hover:bg-red-700">{confirmLabel}</button></div></section></div>;
}
