"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { useMenuData } from "@/hooks/use-menu-data";
import { CartPanel } from "@/components/cart/cart-panel";
import { CategoryNav } from "@/components/category-nav";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { InfoSection } from "@/components/info-section";
import { MobileBar } from "@/components/mobile-bar";
import { ProductGrid } from "@/components/product-grid";
import { TableBanner } from "@/components/table-banner";
import { Toast } from "@/components/toast";
import { useCart } from "@/hooks/use-cart";
import { useCustomer } from "@/hooks/use-customer";
import { useShopUi } from "@/hooks/use-shop-ui";
import { useTable } from "@/hooks/use-table";
import { cooldownLeft, markOrderSent, ORDER_LIMIT } from "@/lib/table";
import { deliveryFee } from "@/lib/delivery";
import { popularProducts } from "@/lib/popular";
import { buildReceipt, buildTableReceipt, openWhatsApp, whatsappUrl } from "@/lib/order";
import { retryQueuedOrders, submitOrder } from "@/lib/order-flow";

export function MenuShop() {
  const { products, categories: menuCategories, loading: menuLoading, error: menuError, retry: retryMenu } = useMenuData();
  const categories = ["Популярное", "Все", ...menuCategories];
  const { settings, loading: settingsLoading } = useDemoSettings();
  const availableProducts = useMemo(() => products.filter((product) => product.inStock), [products]);
  const cart = useCart(availableProducts);
  const table = useTable();
  const customer = useCustomer(table);
  const ui = useShopUi(cart.itemCount, cart.addProduct);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [sentNumber, setSentNumber] = useState<number | null>(null);
  const [orderWarning, setOrderWarning] = useState("");
  const [orderPending, setOrderPending] = useState(false); const orderSubmittingRef = useRef(false);
  // Один раз за визит дозаписываем заказы, которые не попали в Firestore на прошлом заходе.
  useEffect(() => { retryQueuedOrders(); }, []);
  const search = ui.searchQuery.trim().toLocaleLowerCase("ru");
  // «Популярное» наполняется автоматически: явные хиты, иначе — топ ключевых категорий,
  // поэтому вкладка не пустует даже если флаг «Популярное» нигде не выставлен.
  const popular = useMemo(() => popularProducts(availableProducts), [availableProducts]);
  const visibleProducts = search
    ? availableProducts.filter((product) => `${product.name} ${product.description}`.toLocaleLowerCase("ru").includes(search))
    : ui.activeCategory === "Популярное" ? popular
      : ui.activeCategory === "Все" ? availableProducts
        : availableProducts.filter((product) => product.category === ui.activeCategory);
  const productGroups = categories.filter((category) => !["Популярное", "Все"].includes(category)).map((category) => ({
    category, products: visibleProducts.filter((product) => product.category === category),
  })).filter((group) => group.products.length > 0);
  const orderItems = cart.cartLines.map(({ product, quantity }) => ({ productId: product.id, productName: product.name, price: product.price, quantity }));
  async function sendOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (orderSubmittingRef.current) return;
    // Лимит позиций согласован с firestore.rules: больше заказ не сохранится.
    if (orderItems.length > ORDER_LIMIT) { setOrderWarning(`В заказе не больше ${ORDER_LIMIT} позиций. Уберите лишние блюда.`); return; }
    // Ошибок базы клиент не видит: не записалось — чек уходит в WhatsApp без номера.
    if (table !== null) {
      if (customer.trap.trim() || !settings.acceptingDinein || !settings.acceptingOrders) return;
      if (!customer.validateForm()) return;
      const wait = cooldownLeft();
      if (wait > 0) { setOrderWarning("Подождите минуту перед следующим заказом"); return; }
      orderSubmittingRef.current = true; setOrderPending(true);
      try {
        const { order } = await submitOrder({ createdAt: new Date().toISOString(), name: customer.name.trim(), phone: "", fulfillment: "dinein", tableNumber: table, address: "", comment: customer.comment.trim(), items: orderItems, total: cart.total, status: "new", source: "website" });
        const tableReceipt = buildTableReceipt({ orderNumber: order?.number ?? null, table, cartLines: cart.cartLines, total: cart.total, comment: customer.comment, name: customer.name });
        const tableUrl = whatsappUrl(settings.whatsappDineIn || settings.whatsappNumber, tableReceipt);
        markOrderSent(); setOrderWarning(""); setSentNumber(order?.number ?? null); setReceiptUrl(tableUrl); ui.setOrderSent(true);
        openWhatsApp(tableUrl);
      }
      finally { orderSubmittingRef.current = false; setOrderPending(false); }
      return;
    }
    if (!customer.validateForm() || !settings.acceptingOrders) return;
    if (customer.fulfillment === "delivery" && cart.total < settings.minimumOrder) return;
    // Тот же интервал между заказами, что и для зала: это удобство, а не защита.
    const wait = cooldownLeft();
    if (wait > 0) { setOrderWarning("Подождите минуту перед следующим заказом"); return; }
    const fee = deliveryFee(cart.total, customer.fulfillment, settings);
    orderSubmittingRef.current = true; setOrderPending(true);
    try {
      const { order } = await submitOrder({ createdAt: new Date().toISOString(), name: customer.name.trim(), phone: customer.phone, fulfillment: customer.fulfillment, address: customer.orderAddress, comment: customer.comment.trim(), items: orderItems, total: cart.total, status: "new", source: "website", ...(customer.fulfillment === "delivery" && fee !== null ? { deliveryFee: fee } : {}) });
      const receipt = buildReceipt({ orderNumber: order?.number ?? null, cartLines: cart.cartLines, total: cart.total, fee, fulfillment: customer.fulfillment, name: customer.name, phone: customer.phone, address: customer.orderAddress });
      const url = whatsappUrl(settings.whatsappNumber, receipt);
      markOrderSent(); setOrderWarning(""); setSentNumber(order?.number ?? null); setReceiptUrl(url); ui.setOrderSent(true);
      // Если браузер заблокирует новое окно, отправка остаётся кнопкой на экране заказа.
      openWhatsApp(url);
    }
    finally { orderSubmittingRef.current = false; setOrderPending(false); }
  }
  return <main className="min-h-dvh overflow-x-clip text-text">
    <Header itemCount={cart.itemCount} onOpenCart={ui.openCart} />
    {table !== null && <TableBanner table={table} onOrder={ui.openCartAny} />}
    <Hero onOrder={table !== null ? ui.openCartAny : ui.startOrder} openingHours={settings.openingHours} phone={settings.phone} />
    <section id="menu" className="scroll-mt-16 border-y border-accent/25"><div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 pb-10 pt-6 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
      <CategoryNav categories={categories} active={ui.activeCategory} searchActive={Boolean(ui.searchQuery)} onSelect={ui.selectCategory}>{menuLoading ? <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-surface" />)}</div> : menuError ? <div role="alert" className="rounded-2xl border border-line bg-surface p-8 text-center text-muted"><p>{menuError}</p><button onClick={retryMenu} className="mt-4 min-h-11 rounded-lg bg-accent px-4 font-bold text-background">Повторить</button></div> : <ProductGrid products={visibleProducts} title={ui.activeCategory} groups={productGroups} isAll={!search && ui.activeCategory === "Все"} onShowAll={() => ui.selectCategory("Все")} query={ui.searchQuery} onQuery={ui.setSearchQuery} cart={cart.cart} cartOpen={ui.cartDialogOpen} onAdd={ui.addProduct} onChange={cart.changeQuantity} listRef={ui.menuListRef} />}</CategoryNav>
    </div></section>
    {settingsLoading ? <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-6"><div className="my-8 h-64 animate-pulse rounded-2xl bg-surface" /></div> : <InfoSection settings={settings} />}
    <Footer />{ui.notice && <Toast message={ui.notice} />}
    {!ui.cartDialogOpen && <MobileBar itemCount={cart.itemCount} total={cart.total} pulse={ui.cartPulse} onOpenCart={ui.openCart} phone={settings.phone} whatsappNumber={settings.whatsappNumber} />}
    {ui.cartDialogOpen && <CartPanel pending={orderPending} warning={orderWarning} lines={cart.cartLines} orderSent={ui.orderSent} orderNumber={sentNumber} table={table} onAdd={ui.addProduct} onChange={cart.changeQuantity} onSubmit={sendOrder} onClose={ui.closeCart} onGoMenu={ui.closeAndGoToMenu} onClearAndClose={() => { cart.clearCart(); ui.setOrderSent(false); ui.closeCart(); }} onOrderMore={() => { cart.clearCart(); customer.setComment(""); ui.setOrderSent(false); ui.closeAndGoToMenu(); }} receiptUrl={receiptUrl} total={cart.total} fulfillment={customer.fulfillment} setFulfillment={customer.setFulfillment} name={customer.name} setName={customer.setName} phone={customer.phone} setPhone={customer.setPhone} address={customer.address} setAddress={customer.setAddress} comment={customer.comment} setComment={customer.setComment} trap={customer.trap} setTrap={customer.setTrap} remember={customer.remember} setRemember={customer.setRemember} errors={customer.errors} onBlur={customer.blurField} />}
  </main>;
}
