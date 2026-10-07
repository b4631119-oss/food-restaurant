import type { DemoSettings } from "@/lib/models";
import type { Fulfillment } from "@/lib/types";

export type DeliverySettings = Pick<DemoSettings, "deliveryCost" | "freeDeliveryFrom">;

// 0 — бесплатно (самовывоз или достигнут порог freeDeliveryFrom), null — цена не задана («уточним»).
export function deliveryFee(subtotal: number, fulfillment: Fulfillment, settings: DeliverySettings): number | null {
  if (fulfillment !== "delivery") return 0;
  const freeFrom = Number(settings.freeDeliveryFrom) || 0;
  if (freeFrom > 0 && subtotal >= freeFrom) return 0;
  const match = /\d+/.exec(settings.deliveryCost);
  const cost = match ? Number(match[0]) : 0;
  return cost > 0 ? cost : null;
}
