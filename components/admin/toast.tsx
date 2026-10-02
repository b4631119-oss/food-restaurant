"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type AdminToastProps = { message: string; actionLabel?: string; onAction?: () => void; onDismiss: () => void };
export function AdminToast({ message, actionLabel, onAction, onDismiss }: AdminToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, actionLabel ? 5000 : 2000);
    return () => window.clearTimeout(timer);
  }, [actionLabel, onDismiss]);
  return <div role="status" className="fixed bottom-20 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-xl lg:bottom-5">{message}<span className="flex shrink-0 items-center gap-2">{actionLabel && <button onClick={onAction} className="min-h-11 px-2 font-bold text-accent">{actionLabel}</button>}<button onClick={onDismiss} aria-label="Закрыть уведомление" className="grid size-11 place-items-center text-muted"><X size={18} /></button></span></div>;
}
