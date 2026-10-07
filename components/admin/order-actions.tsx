"use client";

import { Bell, Bike, Check, ChefHat, PackageCheck } from "lucide-react";
import type { DemoOrder, OrderStatus } from "@/lib/models";

export const STATUS_LABEL: Record<OrderStatus, string> = { new: "Новый", preparing: "Готовится", delivering: "В пути", served: "Подано", completed: "Завершён", cancelled: "Отменён" };
const COLORS: Record<OrderStatus, string> = { new: "bg-accent text-background", preparing: "bg-blue-800 text-white", delivering: "bg-violet-800 text-white", served: "bg-teal-700 text-white", completed: "bg-emerald-800 text-white", cancelled: "bg-slate-600 text-white" };
export function StatusBadge({ status }: { status: OrderStatus }) { return <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold ${COLORS[status]}`}>{STATUS_LABEL[status]}</span>; }
export function nextOrderStatus(order: DemoOrder): OrderStatus | null {
  if (order.status === "new") return "preparing";
  if (order.status === "preparing") return order.fulfillment === "delivery" ? "delivering" : order.fulfillment === "dinein" ? "served" : "completed";
  return order.status === "delivering" || order.status === "served" ? "completed" : null;
}
export function mainActionLabel(order: DemoOrder): string {
  if (order.status === "new") return "Принять";
  if (order.status === "preparing") return order.fulfillment === "delivery" ? "Передать курьеру" : order.fulfillment === "dinein" ? "Подать" : "Готово";
  return order.status === "delivering" || order.status === "served" ? "Завершить" : "";
}
export function MainOrderAction({ order, onAdvance }: { order: DemoOrder; onAdvance: () => void }) {
  const Icon = order.status === "new" ? ChefHat : order.status === "preparing" && order.fulfillment === "delivery" ? Bike : order.status === "preparing" ? PackageCheck : order.status === "served" ? Bell : Check;
  return <button onClick={onAdvance} className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-accent px-3 text-sm font-bold text-background"><Icon size={18} />{mainActionLabel(order)}</button>;
}
