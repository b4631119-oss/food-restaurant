"use client";

import { useEffect, useMemo, useState } from "react";
import { CartPanel } from "@/components/cart/cart-panel";
import { CategoryNav } from "@/components/category-nav";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { InfoSection } from "@/components/info-section";
import { MobileBar } from "@/components/mobile-bar";
import { ProductGrid } from "@/components/product-grid";
import { Toast } from "@/components/toast";
import { useCart } from "@/hooks/use-cart";
import { useCustomer } from "@/hooks/use-customer";
import { useShopUi } from "@/hooks/use-shop-ui";
import menuData from "@/data/menu.json";
import { buildReceipt, buildWhatsAppUrl } from "@/lib/order";
import { DEMO_DATA_EVENT, getProducts as getDemoProducts, getSettings, getOrders, setOrders } from "@/lib/demo-store";
import type { Product } from "@/lib/types";

const defaults = menuData.products as Product[];
const defaultCategories = menuData.categories as string[];

export function MenuShop() {
  const [products, setProducts] = useState<Product[]>(defaults);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  useEffect(() => {
    const refresh = () => { setProducts(getDemoProducts().filter((product) => product.inStock) as Product[]); setCategories(["Популярное", "Все", ...defaultCategories]); };
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(DEMO_DATA_EVENT, refresh); window.addEventListener("storage", refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener(DEMO_DATA_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);
  const availableProducts = useMemo(() => products, [products]);
  const cart = useCart(availableProducts);
  const customer = useCustomer();
  const ui = useShopUi(cart.itemCount, cart.addProduct);
  const [receiptUrl, setReceiptUrl] = useState("");
  const search = ui.searchQuery.trim().toLocaleLowerCase("ru");
  const visibleProducts = availableProducts.filter((product) => search
    ? `${product.name} ${product.description}`.toLocaleLowerCase("ru").includes(search)
    : ui.activeCategory === "Популярное" ? "popular" in product && product.popular
      : ui.activeCategory === "Все" || product.category === ui.activeCategory);
  const productGroups = menuData.categories.map((category) => ({
    category,
    products: visibleProducts.filter((product) => product.category === category),
  })).filter((group) => group.products.length > 0);
  const sendOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer.validateForm()) return;
    if (!getSettings().acceptingOrders) return;
    if (customer.fulfillment === "delivery" && cart.total < getSettings().minimumOrder) return;
    const receipt = buildReceipt({ cartLines: cart.cartLines, total: cart.total, fulfillment: customer.fulfillment, name: customer.name, phone: customer.phone, address: customer.address });
    const orders = getOrders();
    setOrders([{ id: crypto.randomUUID(), number: Math.max(1000, ...orders.map((order) => order.number)) + 1, createdAt: new Date().toISOString(), name: customer.name.trim(), phone: customer.phone, fulfillment: customer.fulfillment, address: customer.address.trim(), comment: "", items: cart.cartLines.map(({ product, quantity }) => ({ productId: product.id, productName: product.name, price: product.price, quantity })), total: cart.total, status: "new", source: "website" }, ...orders]);
    setReceiptUrl(buildWhatsAppUrl(receipt));
    ui.setOrderSent(true);
  };

  return (
    <main className="min-h-dvh overflow-x-clip pb-20 text-text lg:pb-0">
      <Header itemCount={cart.itemCount} onOpenCart={ui.openCart} /><Hero onOrder={ui.startOrder} />
      <section id="menu" className="scroll-mt-16 border-y border-accent/25">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 pb-10 pt-6 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
          <CategoryNav categories={categories} active={ui.activeCategory} searchActive={Boolean(ui.searchQuery)} onSelect={ui.selectCategory}>
            <ProductGrid products={visibleProducts} title={ui.activeCategory} groups={productGroups} isAll={!search && ui.activeCategory === "Все"} onShowAll={() => ui.selectCategory("Все")} query={ui.searchQuery} onQuery={ui.setSearchQuery} cart={cart.cart} onAdd={ui.addProduct} onChange={cart.changeQuantity} listRef={ui.menuListRef} />
          </CategoryNav>
          <InfoSection />
        </div>
      </section>
      <Footer />{ui.notice && <Toast message={ui.notice} />}
      {!ui.cartDialogOpen && <MobileBar itemCount={cart.itemCount} total={cart.total} pulse={ui.cartPulse} onOpenCart={ui.openCart} />}
      {ui.cartDialogOpen && <CartPanel lines={cart.cartLines} orderSent={ui.orderSent} onClose={ui.closeCart} onGoMenu={ui.closeAndGoToMenu} onAdd={ui.addProduct} onChange={cart.changeQuantity} onSubmit={sendOrder} onClearAndClose={() => { cart.clearCart(); ui.setOrderSent(false); ui.closeCart(); }} receiptUrl={receiptUrl} total={cart.total} fulfillment={customer.fulfillment} setFulfillment={customer.setFulfillment} name={customer.name} setName={customer.setName} phone={customer.phone} setPhone={customer.setPhone} address={customer.address} setAddress={customer.setAddress} errors={customer.errors} onBlur={customer.blurField} />}
    </main>
  );
}
