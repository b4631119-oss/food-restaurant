"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, Menu, Settings, Tags } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const tabs: [string, string, LucideIcon][] = [["Обзор", "/admin", BarChart3], ["Заказы", "/admin/orders", ClipboardList], ["Меню", "/admin/menu", Menu], ["Категории", "/admin/categories", Tags], ["Настройки", "/admin/settings", Settings]];
export function AdminBottomNav({ pathname, count, hidden = false }: { pathname: string; count: number; hidden?: boolean }) {
  return <nav aria-label="Нижняя навигация" aria-hidden={hidden} className={`fixed inset-x-0 bottom-0 z-30 grid h-[calc(64px+env(safe-area-inset-bottom,0px))] grid-cols-5 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur transition-transform lg:hidden ${hidden ? "invisible pointer-events-none translate-y-full" : ""}`}>{tabs.map(([label, href, Icon]) => {
    const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`relative flex h-full min-w-0 min-h-11 flex-col items-center justify-center gap-0.5 outline-none [-webkit-tap-highlight-color:transparent] transition-transform duration-100 active:scale-95 focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${active ? "text-accent" : "text-muted"}`}>{active && <i aria-hidden="true" className="absolute left-1/2 top-0 h-[3px] w-8 -translate-x-1/2 rounded-full bg-accent" />}<span className="relative grid size-7 place-items-center"><Icon size={24} />{label === "Заказы" && count > 0 && <b aria-label={`Новых заказов: ${count}`} className="absolute -right-2 -top-1 grid size-[18px] place-items-center rounded-full bg-accent text-[11px] font-bold leading-none text-background">{count > 9 ? "9+" : count}</b>}</span><span className="w-full truncate px-1 text-center text-xs leading-4">{label}</span></Link>;
  })}</nav>;
}
