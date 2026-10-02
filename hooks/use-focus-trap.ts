"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function findOpener(): HTMLElement | null {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("button")];
  const mobile = buttons.find((button) => button.textContent?.includes("Корзина ·"));
  const header = document.querySelector<HTMLElement>('[aria-label^="Открыть корзину"]');
  return (window.matchMedia("(max-width: 1023px)").matches ? mobile ?? header : header ?? mobile) ?? null;
}

export function useFocusTrap(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const opener = useRef<HTMLElement | null>(null);
  const restoreTimer = useRef<number | null>(null);

  useEffect(() => {
    if (restoreTimer.current !== null) window.clearTimeout(restoreTimer.current);
    const panel = ref.current;
    if (!panel) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && !panel.contains(active)) opener.current = active;
    panel.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => item.getClientRects().length > 0);
      if (!items.length) { event.preventDefault(); panel.focus(); return; }
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && index === items.length - 1) { event.preventDefault(); items[0].focus(); }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => {
      panel.removeEventListener("keydown", onKeyDown);
      restoreTimer.current = window.setTimeout(() => {
        const target = opener.current?.isConnected ? opener.current : findOpener();
        target?.focus();
      }, 0);
    };
  }, [ref, onClose]);
}
