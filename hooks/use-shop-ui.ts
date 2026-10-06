"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useShopUi(itemCount: number, addToCart: (productId: string) => void) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [allowEmpty, setAllowEmpty] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Популярное");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [orderSent, setOrderSent] = useState(false);
  const menuListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const cartDialogOpen = cartOpen && (itemCount > 0 || orderSent || allowEmpty);
  const openCart = () => { if (itemCount > 0) setCartOpen(true); };
  const openCartAny = () => { setAllowEmpty(true); setCartOpen(true); };
  const closeCart = useCallback(() => setCartOpen(false), []);
  const addProduct = (productId: string) => {
    addToCart(productId);
    setOrderSent(false);
    setCartPulse(true);
    window.setTimeout(() => setCartPulse(false), 450);
  };
  const goToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    setNotice("Выберите блюда — и оформите заказ в корзине.");
  };
  const closeAndGoToMenu = () => { setCartOpen(false); goToMenu(); };
  const startOrder = () => { if (itemCount > 0) setCartOpen(true); else goToMenu(); };
  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    window.setTimeout(() => menuListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const returnToMenu = () => { setOrderSent(false); setCartOpen(false); };

  return {
    cartOpen, cartPulse, activeCategory, searchQuery, setSearchQuery, notice, orderSent,
    setOrderSent, menuListRef, cartDialogOpen, openCart, openCartAny, closeCart, addProduct,
    goToMenu, closeAndGoToMenu, startOrder, selectCategory, returnToMenu,
  };
}
