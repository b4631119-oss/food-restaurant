"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { BarChart3, ClipboardList, LogOut, Menu, Tags, Settings } from "lucide-react";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { isAdminUser } from "@/lib/repo/admins-repo";
import { watchOrders } from "@/lib/repo/orders-repo";
import { auth } from "@/lib/firebase";
const tabs = [["Обзор", "/admin", BarChart3], ["Заказы", "/admin/orders", ClipboardList], ["Меню", "/admin/menu", Menu], ["Категории", "/admin/categories", Tags], ["Настройки", "/admin/settings", Settings]] as const;
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const isLogin = pathname === "/admin/login";
  const [authorized, setAuthorized] = useState(false); const [authReady, setAuthReady] = useState(false); const [overlayOpen, setOverlayOpen] = useState(false);
  const [newOrders, setNewOrders] = useState(0);
  useEffect(() => onAuthStateChanged(auth, (current) => {
    void isAdminUser(current).then((ok) => {
      setAuthorized(ok); setAuthReady(true);
      if (!ok && !isLogin) router.replace("/admin/login");
      if (ok && isLogin) router.replace("/admin");
    });
  }), [isLogin, router]);
  useEffect(() => { if (!authorized) return; return watchOrders((orders) => setNewOrders(orders.filter((order) => order.status === "new").length)); }, [authorized]);
  useEffect(() => { const update = () => setOverlayOpen(Boolean(document.querySelector("[role='dialog'][aria-modal='true'], [role='alertdialog'][aria-modal='true'], [class*='fixed'][class*='inset-0'][class*='z-50']"))); update(); const observer = new MutationObserver(update); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-modal", "class"] }); return () => observer.disconnect(); }, []);
  if (isLogin) return <>{children}</>;
  if (!authReady || !authorized) return <main className="grid min-h-dvh place-items-center bg-background text-muted">Загрузка админки…</main>;
  const logout = () => { void signOut(auth); router.replace("/admin/login"); };
  return <div className="admin-shell min-h-dvh bg-background pb-0 text-text"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface p-5 lg:flex lg:flex-col"><Brand /><nav className="mt-8 flex-1 space-y-1">{tabs.map((tab) => <NavLink key={tab[1]} tab={tab} pathname={pathname} count={newOrders} />)}</nav><button onClick={logout} className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-background"><LogOut size={18} />Выйти</button></aside><div className="lg:pl-64"><header className="flex min-h-14 items-center justify-between border-b border-line px-4 lg:hidden"><Brand /><button onClick={logout} aria-label="Выйти" className="grid size-11 place-items-center text-muted"><LogOut size={20} /></button></header><main className="w-full p-4 pb-[calc(64px+env(safe-area-inset-bottom,0px)+16px)] sm:p-6 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px)+16px)] lg:pb-6">{children}</main></div><AdminBottomNav pathname={pathname} count={newOrders} hidden={overlayOpen} /></div>;
}
function Brand() { return <Link href="/admin" className="font-bold">Sushi Bar <span className="text-accent">№1</span><span className="mt-1 block text-xs font-normal text-muted">Панель управления</span></Link>; }
function NavLink({ tab, pathname, count }: { tab: (typeof tabs)[number]; pathname: string; count: number }) {
  const [label, href, Icon] = tab; const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
  return <Link href={href} className={`relative flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${active ? "bg-accent/10 text-accent" : "text-muted hover:bg-background"}`}><span className="relative"><Icon size={20} />{label === "Заказы" && count > 0 && <b className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-accent text-[10px] text-background">{count}</b>}</span><span>{label}</span></Link>;
}
