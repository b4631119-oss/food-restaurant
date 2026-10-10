export type OrderStatus = "new" | "preparing" | "delivering" | "served" | "completed" | "cancelled";
export type OrderType = "delivery" | "pickup" | "dinein";
export type OrderItem = { productId: string; productName: string; price: number; quantity: number };
export type DemoOrder = { id: string; number: number; createdAt: string; name: string; phone: string; fulfillment: OrderType; tableNumber?: number; address: string; comment: string; items: OrderItem[]; total: number; deliveryFee?: number; status: OrderStatus; source?: "website"; location?: { lat: number; lng: number }; mapLink?: string };
export type ProductVariant = { id: string; label: string; name: string; price: number; weight?: string };
export type Product = { id: string; name: string; description: string; price: number; category: string; image: string; inStock: boolean; popular?: boolean; weight?: string; variants?: ProductVariant[]; categoryOrder?: number; itemOrder?: number; sourcePage?: number; sourceStatus?: string; variantGroupId?: string; variantGroupName?: string; variantLabel?: string };
export type DemoProduct = Product;
export type DemoSettings = { acceptingOrders: boolean; acceptingDinein: boolean; phone: string; whatsappNumber: string; whatsappDineIn: string; minimumOrder: number; freeDeliveryFrom: number; deliveryTime: string; deliveryCost: string; paymentMethods: string; openingHours: string; address: string; mapUrl: string };
