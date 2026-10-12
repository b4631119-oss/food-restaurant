import { bishkekParts } from "@/lib/report-period";
import { orderPlace } from "@/lib/format";
import type { DemoOrder } from "@/lib/models";

const HEADER = ["номер", "дата", "время", "тип", "стол", "имя", "телефон", "адрес", "блюда", "сумма блюд", "доставка", "комментарий"];

// Защита от CSV-инъекций: значение, начинающееся с =, +, -, @ или управляющего
// символа, Excel и Google Sheets могут выполнить как формулу — экранируем апострофом.
function cell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function ordersCsv(orders: DemoOrder[]): string {
  const rows = orders.map((order) => {
    const { date, time } = bishkekParts(order.createdAt);
    return [
      order.number, date, time, orderPlace(order), order.tableNumber ?? "", order.name, order.phone,
      order.address, order.items.map((item) => `${item.quantity}×${item.productName}`).join("; "),
      order.total, order.deliveryFee ?? "", order.comment,
    ];
  });
  return [HEADER, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
}

export function downloadOrdersCsv(orders: DemoOrder[], from: string, to: string): void {
  const blob = new Blob([`\uFEFF${ordersCsv(orders)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sushi-bar-zakazy-${from}-${to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
