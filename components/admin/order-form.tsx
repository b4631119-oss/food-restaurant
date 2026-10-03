"use client";

import { useState, type FormEvent } from "react";
import type { DemoOrder, DemoProduct, OrderStatus } from "@/lib/models";

type Props = { order?: DemoOrder; products: DemoProduct[]; onSave: (order: DemoOrder) => void; onCancel: () => void };
export function OrderForm({ order, products, onSave, onCancel }: Props) {
  const [name, setName] = useState(order?.name ?? ""); const [phone, setPhone] = useState(order?.phone ?? "");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(order?.fulfillment ?? "delivery");
  const [address, setAddress] = useState(order?.address ?? ""); const [comment, setComment] = useState(order?.comment ?? "");
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "new");
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries((order?.items ?? []).map((item) => [item.productId, item.quantity])));
  const total = products.reduce((sum, product) => sum + product.price * (quantities[product.id] ?? 0), 0);
  function submit(event: FormEvent) {
    event.preventDefault();
    const items = products.filter((product) => quantities[product.id] > 0).map((product) => ({ productId: product.id, productName: product.name, price: product.price, quantity: quantities[product.id] }));
    if (!name.trim() || !phone.trim() || !items.length) return;
    onSave({ id: order?.id ?? "", number: order?.number ?? 0, createdAt: order?.createdAt ?? new Date().toISOString(), name: name.trim(), phone: phone.trim(), fulfillment, address: fulfillment === "delivery" ? address.trim() : "", comment, items, total, status });
  }
  const field = "mt-1 h-[52px] w-full rounded-lg border border-line bg-background px-3 text-base outline-none focus:border-accent";
  return <form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Имя<input required value={name} onChange={(e) => setName(e.target.value)} className={field} /></label><label className="text-sm">Телефон<input required value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className={field} /></label></div>
    <label className="block text-sm">Тип заказа<select value={fulfillment} onChange={(e) => setFulfillment(e.target.value as "delivery" | "pickup")} className={field}><option value="delivery">Доставка</option><option value="pickup">Самовывоз</option></select></label>
    {fulfillment === "delivery" && <label className="block text-sm">Адрес<input value={address} onChange={(e) => setAddress(e.target.value)} className={field} /></label>}
    <label className="block text-sm">Комментарий<textarea value={comment} onChange={(e) => setComment(e.target.value)} className={`${field} h-24 py-3`} /></label>
    <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-line p-3">{products.map((product) => <label key={product.id} className="flex min-h-11 items-center justify-between gap-3 text-sm"><span>{product.name} · {product.price} сом</span><input type="number" min="0" value={quantities[product.id] ?? 0} onChange={(e) => setQuantities({ ...quantities, [product.id]: Math.max(0, Number(e.target.value)) })} className="h-11 w-20 rounded-lg border border-line bg-background px-2 text-center" /></label>)}</div>
    <div className="flex items-center justify-between text-sm"><span>Сумма: <b className="text-accent">{total} сом</b></span><select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="h-11 rounded-lg border border-line bg-background px-2"><option value="new">Новый</option><option value="preparing">Готовится</option><option value="delivering">В пути</option><option value="completed">Завершён</option><option value="cancelled">Отменён</option></select></div>
    <div className="flex gap-3"><button type="button" onClick={onCancel} className="min-h-12 flex-1 rounded-lg border border-line">Отмена</button><button className="min-h-12 flex-1 rounded-lg bg-accent font-bold text-background">Сохранить</button></div>
  </form>;
}
