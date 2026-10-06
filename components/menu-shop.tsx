"use client";

import { useRef, useState } from "react";
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
import { buildReceipt } from "@/lib/order";
import { createOrder } from "@/lib/repo/orders-repo";

export function MenuShop() {
  const { products, categories: menuCategories, loading: menuLoading, error: menuError, retry: retryMenu } = useMenuData();
  const categories = ["Популярное", "Все", ...menuCategories];
  const { settings, loading: settingsLoading } = useDemoSettings();
  const availableProducts = products.filter((product) => product.inStock);
  const cart = useCart(availableProducts);
  const table = useTable();
  const customer = useCustomer(table);
  const ui = useShopUi(cart.itemCount, cart.addProduct);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [sentNumber, setSentNumber] = useState(0);
  const [orderWarning, setOrderWarning] = useState("");
  const [orderPending, setOrderPending] = useState(false); const orderSubmittingRef = useRef(false);
  const search = ui.searchQuery.trim().toLocaleLowerCase("ru");
  const visibleProducts = availableProducts.filter((product) => search
    ? `${product.name} ${product.description}`.toLocaleLowerCase("ru").includes(search)
    : ui.activeCategory === "Популярное" ? "popular" in product && product.popular
      : ui.activeCategory === "Все" || product.category === ui.activeCategory);
  const productGroups = categories.filter((category) => !["Популярное", "Все"].includes(category)).map((category) => ({
    category, products: visibleProducts.filter((product) => product.category === category),
  })).filter((group) => group.products.length > 0);
  const orderItems = cart.cartLines.map(({ product, quantity }) => ({ productId: product.id, productName: product.name, price: product.price, quantity }));
  async function sendOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (orderSubmittingRef.current) return;
    if (table !== null) {
      if (customer.trap.trim() || !settings.acceptingDinein || !settings.acceptingOrders) return;
      if (!customer.validateForm()) return;
      if (cart.itemCount > ORDER_LIMIT) { setOrderWarning(`В заказе не больше ${ORDER_LIMIT} позиций. Уберите лишние блюда.`); return; }
      const wait = cooldownLeft();
      if (wait > 0) { setOrderWarning(`Заказ можно отправлять не чаще одного раза в 2 минуты. Подождите ещё ${Math.ceil(wait / 1000)} секунд.`); return; }
      orderSubmittingRef.current = true; setOrderPending(true);
      try {
        const created = await createOrder({ createdAt: new Date().toISOString(), name: customer.name.trim(), phone: "", fulfillment: "dinein", tableNumber: table, address: "", comment: customer.comment.trim(), items: orderItems, total: cart.total, status: "new", source: "website" });
        markOrderSent(); setOrderWarning(""); setSentNumber(created.number); ui.setOrderSent(true);
      }
      catch { setOrderWarning("Не удалось отправить заказ. Проверьте подключение к интернету и попробуйте ещё раз."); }
      finally { orderSubmittingRef.current = false; setOrderPending(false); }
      return;
    }
    if (!customer.validateForm() || !settings.acceptingOrders) return;
    if (customer.fulfillment === "delivery" && cart.total < settings.minimumOrder) return;
    const receipt = buildReceipt({ cartLines: cart.cartLines, total: cart.total, fulfillment: customer.fulfillment, name: customer.name, phone: customer.phone, address: customer.address });
    const url = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(receipt)}`;
    orderSubmittingRef.current = true; setOrderPending(true);
    try {
      await createOrder({ createdAt: new Date().toISOString(), name: customer.name.trim(), phone: customer.phone, fulfillment: customer.fulfillment, address: customer.address.trim(), comment: "", items: orderItems, total: cart.total, status: "new", source: "website" });
      setOrderWarning(""); setReceiptUrl(url); ui.setOrderSent(true);
      const whatsapp = window.open("about:blank", "_blank"); if (whatsapp) { whatsapp.opener = null; whatsapp.location.href = url; }
      if (!whatsapp) window.location.href = url;
    }
    catch { setOrderWarning("Не удалось оформить заказ. Проверьте подключение к интернету и попробуйте ещё раз."); }
    finally { orderSubmittingRef.current = false; setOrderPending(false); }
  }
  return <main className="min-h-dvh overflow-x-clip pb-20 text-text lg:pb-0">
    <Header itemCount={cart.itemCount} onOpenCart={ui.openCart} />
    {table !== null && <TableBanner table={table} onOrder={ui.openCartAny} />}
    <Hero onOrder={table !== null ? ui.openCartAny : ui.startOrder} openingHours={settings.openingHours} phone={settings.phone} />
    <section id="menu" className="scroll-mt-16 border-y border-accent/25"><div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 pb-10 pt-6 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
      <CategoryNav categories={categories} active={ui.activeCategory} searchActive={Boolean(ui.searchQuery)} onSelect={ui.selectCategory}>{menuLoading ? <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-surface" />)}</div> : menuError ? <div role="alert" className="rounded-2xl border border-line bg-surface p-8 text-center text-muted"><p>{menuError}</p><button onClick={retryMenu} className="mt-4 min-h-11 rounded-lg bg-accent px-4 font-bold text-background">Повторить</button></div> : <ProductGrid products={visibleProducts} title={ui.activeCategory} groups={productGroups} isAll={!search && ui.activeCategory === "Все"} onShowAll={() => ui.selectCategory("Все")} query={ui.searchQuery} onQuery={ui.setSearchQuery} cart={cart.cart} onAdd={ui.addProduct} onChange={cart.changeQuantity} listRef={ui.menuListRef} />}</CategoryNav>
      {settingsLoading ? <div className="h-48 animate-pulse rounded-2xl bg-surface" /> : <InfoSection settings={settings} />}
    </div></section>
    <Footer />{ui.notice && <Toast message={ui.notice} />}
    {!ui.cartDialogOpen && <MobileBar itemCount={cart.itemCount} total={cart.total} pulse={ui.cartPulse} onOpenCart={ui.openCart} phone={settings.phone} whatsappNumber={settings.whatsappNumber} />}
    {ui.cartDialogOpen && <CartPanel pending={orderPending} warning={orderWarning} lines={cart.cartLines} orderSent={ui.orderSent} orderNumber={sentNumber} table={table} onAdd={ui.addProduct} onChange={cart.changeQuantity} onSubmit={sendOrder} onClose={ui.closeCart} onGoMenu={ui.closeAndGoToMenu} onClearAndClose={() => { cart.clearCart(); ui.setOrderSent(false); ui.closeCart(); }} onOrderMore={() => { cart.clearCart(); customer.setComment(""); ui.setOrderSent(false); ui.closeAndGoToMenu(); }} receiptUrl={receiptUrl} total={cart.total} fulfillment={customer.fulfillment} setFulfillment={customer.setFulfillment} name={customer.name} setName={customer.setName} phone={customer.phone} setPhone={customer.setPhone} address={customer.address} setAddress={customer.setAddress} comment={customer.comment} setComment={customer.setComment} trap={customer.trap} setTrap={customer.setTrap} errors={customer.errors} onBlur={customer.blurField} />}
  </main>;
}
