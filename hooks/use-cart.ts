"use client";

import { useEffect, useMemo, useState } from "react";
import { CART_KEY, readCart } from "@/lib/cart-storage";
import type { Cart, CartLine, Product } from "@/lib/types";

export function useCart(products: Product[]) {
  const [cart, setCart] = useState<Cart>({});
  const [cartReady, setCartReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => { setCart(readCart()); setCartReady(true); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!cartReady) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* Keep cart usable without storage. */ }
  }, [cart, cartReady]);
  const cartLines = useMemo<CartLine[]>(() => products.filter((product) => (cart[product.id] ?? 0) > 0)
    .map((product) => ({ product, quantity: cart[product.id] })), [products, cart]);
  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const total = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  function addProduct(id: string) { setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 })); }
  function changeQuantity(id: string, amount: number) {
    setCart((current) => {
      const quantity = (current[id] ?? 0) + amount;
      if (quantity <= 0) { const next = { ...current }; delete next[id]; return next; }
      return { ...current, [id]: quantity };
    });
  }
  function clearCart() { setCart({}); }
  return { cart, cartReady, cartLines, itemCount, total, addProduct, changeQuantity, clearCart };
}
