import type { Product } from "@/lib/types";

export type OrderStatus = "new" | "preparing" | "delivering" | "completed" | "cancelled";
export type OrderItem = { productId: string; productName: string; price: number; quantity: number };
export type DemoOrder = { id: string; number: number; createdAt: string; name: string; phone: string; fulfillment: "delivery" | "pickup"; address: string; comment: string; items: OrderItem[]; total: number; status: OrderStatus; source?: "website" | "demo" };
export type DemoProduct = Product & { id: string; name: string; description: string; price: number; category: string; image: string; inStock: boolean; popular?: boolean; weight?: string };
export type DemoSettings = { acceptingOrders: boolean; phone: string; whatsappNumber: string; minimumOrder: number; deliveryTime: string; openingHours: string; address: string };
