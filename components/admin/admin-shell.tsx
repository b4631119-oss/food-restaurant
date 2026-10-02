"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ClipboardList, LogOut, Menu, Tags, Settings } from "lucide-react";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { DEMO_AUTH_KEY, DEMO_DATA_EVENT, getOrders } from "@/lib/demo-store";
import { seedDemoData } from "@/lib/demo-seed";

const tabs = [["Обзор", "/admin", BarChart3], ["Заказы", "/admin/orders", ClipboardList], ["Меню", "/admin/menu", Menu], ["Категории", "/admin/categories", Tags], ["Настройки", "/admin/settings", Settings]] as const;
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [overlayOpen, setOverlayOpen] = useState(false);
  useEffect(() => { if (isLogin) return; const update = () => setOverlayOpen(Boolean(document.querySelector("[role='dialog'][aria-modal='true'], [role='alertdialog'][aria-modal='true'], [class*='fixed'][class*='inset-0'][class*='z-50']"))); update(); const observer = new MutationObserver(update); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-modal", "class"] }); return () => observer.disconnect(); }, [isLogin]);
  const [ready, setReady] = useState(false); const [newOrders, setNewOrders] = useState(0);
  useEffect(() => {
    if (isLogin) return;
    if (!sessionStorage.getItem(DEMO_AUTH_KEY)) { router.replace("/admin/login"); return; }
    const refresh = () => setNewOrders(getOrders().filter((order) => order.status === "new").length);
    const init = window.setTimeout(() => { seedDemoData(); refresh(); setReady(true); }, 0);
    const timer = window.setInterval(refresh, 3000);
    window.addEventListener("storage", refresh); window.addEventListener(DEMO_DATA_EVENT, refresh);
    return () => { window.clearTimeout(init); window.clearInterval(timer); window.removeEventListener("storage", refresh); window.removeEventListener(DEMO_DATA_EVENT, refresh); };
  }, [isLogin, router]);
  if (isLogin) return <>{children}</>;
  if (!ready) return <main className="grid min-h-dvh place-items-center bg-background text-muted">Загрузка демо-админки…</main>;
  const logout = () => { sessionStorage.removeItem(DEMO_AUTH_KEY); router.replace("/admin/login"); };
  return <div className="admin-shell min-h-dvh bg-background pb-0 text-text"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface p-5 lg:flex lg:flex-col"><Brand /><nav className="mt-8 flex-1 space-y-1">{tabs.map((tab) => <NavLink key={tab[1]} tab={tab} pathname={pathname} count={newOrders} />)}</nav><button onClick={logout} className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-background"><LogOut size={18} />Выйти</button></aside><div className="lg:pl-64"><header className="flex min-h-14 items-center justify-between border-b border-line px-4 lg:hidden"><Brand /><button onClick={logout} aria-label="Выйти" className="grid size-11 place-items-center text-muted"><LogOut size={20} /></button></header><div className="whitespace-nowrap border-b border-accent/40 bg-accent/10 px-2 py-1.5 text-center text-xs font-bold text-accent sm:px-4 sm:py-2">ДЕМО · данные только в этом браузере</div><main className="w-full p-4 pb-[calc(64px+env(safe-area-inset-bottom,0px)+16px)] sm:p-6 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px)+16px)] lg:pb-6">{children}</main></div><AdminBottomNav pathname={pathname} count={newOrders} hidden={overlayOpen} /><style jsx global>{`.admin-shell [role="status"] { bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 12px) !important; } @media (min-width: 1024px) { .admin-shell [role="status"] { bottom: 1.25rem !important; } }`}</style></div>;
}
function Brand() { return <Link href="/admin" className="font-bold">Sushi Bar <span className="text-accent">№1</span><span className="mt-1 block text-xs font-normal text-muted">Панель управления</span></Link>; }
function NavLink({ tab, pathname, count, mobile = false }: { tab: (typeof tabs)[number]; pathname: string; count: number; mobile?: boolean }) {
  const [label, href, Icon] = tab; const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
  return <Link href={href} className={`relative flex min-h-12 items-center gap-3 rounded-lg px-2 text-xs font-semibold sm:text-sm ${mobile ? "flex-col justify-center gap-0.5 px-0" : "px-3"} ${active ? "bg-accent/10 text-accent" : "text-muted hover:bg-background"}`}><span className="relative"><Icon size={20} />{label === "Заказы" && count > 0 && <b className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-accent text-[10px] text-background">{count}</b>}</span><span>{label}</span></Link>;
}
