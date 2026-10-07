"use client";

import { money, orderPlace, plural } from "@/lib/format";
import { bishkekParts } from "@/lib/report-period";
import type { DemoOrder } from "@/lib/models";

const HEADS = ["№", "Дата и время", "Тип", "Стол", "Имя", "Телефон", "Блюд", "Сумма"];

export function HistoryTable({ orders, onOpen }: { orders: DemoOrder[]; onOpen: (order: DemoOrder) => void }) {
  return <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-line bg-surface lg:block">
    <table className="w-full min-w-[880px] text-sm">
      <thead className="text-left text-muted"><tr>{HEADS.map((head) => <th key={head} className="px-3 py-3 font-semibold">{head}</th>)}</tr></thead>
      <tbody>{orders.map((order) => {
        const { date, time } = bishkekParts(order.createdAt);
        const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return <tr key={order.id} onClick={() => onOpen(order)} className="cursor-pointer border-t border-line hover:bg-background">
          <td className="whitespace-nowrap px-3 py-3 font-bold">№{order.number}</td>
          <td className="whitespace-nowrap px-3 py-3 text-muted">{date} {time}</td>
          <td className="px-3 py-3">{orderPlace(order)}</td>
          <td className="px-3 py-3 text-muted">{order.tableNumber ?? "—"}</td>
          <td className="max-w-48 truncate px-3 py-3">{order.name || "Гость"}</td>
          <td className="whitespace-nowrap px-3 py-3 text-muted">{order.phone || "—"}</td>
          <td className="whitespace-nowrap px-3 py-3 text-muted">{items} {plural(items, "блюдо", "блюда", "блюд")}</td>
          <td className="whitespace-nowrap px-3 py-3 font-semibold text-accent">{money(order.total)}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
