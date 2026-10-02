"use client";

import { useMemo } from "react";
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
import type { Product } from "@/lib/types";

const products = menuData.products as Product[];
const categories = ["Популярное", ...menuData.categories];

export function MenuShop() {
  const availableProducts = useMemo(() => products.filter((product) => product.inStock), []);
  const cart = useCart(availableProducts);
  const customer = useCustomer();
  const ui = useShopUi(cart.itemCount, cart.addProduct);
  const search = ui.searchQuery.trim().toLocaleLowerCase("ru");
  const visibleProducts = availableProducts.filter((product) => search
    ? `${product.name} ${product.description}`.toLocaleLowerCase("ru").includes(search)
    : ui.activeCategory === "Популярное" ? "popular" in product && product.popular : product.category === ui.activeCategory);
  const sendOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer.validateForm()) return;
    if (cart.cartLines.length === 0) { customer.setFormError("Корзина пуста. Добавьте блюда из меню."); return; }
    const receipt = buildReceipt({ cartLines: cart.cartLines, total: cart.total, fulfillment: customer.fulfillment, name: customer.name, phone: customer.phone.trim(), address: customer.address });
    window.open(buildWhatsAppUrl(receipt), "_blank", "noopener,noreferrer");
    cart.clearCart();
    ui.setOrderSent(true);
    customer.setFormError("");
  };

  return (
    <main className="min-h-dvh overflow-x-clip pb-20 text-text lg:pb-0">
      <Header itemCount={cart.itemCount} onOpenCart={ui.openCart} /><Hero onOrder={ui.startOrder} />
      <section id="menu" className="scroll-mt-16 border-y border-accent/25">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 pb-10 pt-6 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
          <CategoryNav categories={categories} active={ui.activeCategory} searchActive={Boolean(ui.searchQuery)} onSelect={ui.selectCategory}>
            <ProductGrid products={visibleProducts} title={ui.activeCategory} query={ui.searchQuery} onQuery={ui.setSearchQuery} cart={cart.cart} onAdd={ui.addProduct} onChange={cart.changeQuantity} listRef={ui.menuListRef} />
          </CategoryNav>
          <InfoSection />
        </div>
      </section>
      <Footer />{ui.notice && <Toast message={ui.notice} />}
      {!ui.cartDialogOpen && <MobileBar itemCount={cart.itemCount} total={cart.total} pulse={ui.cartPulse} onOpenCart={ui.openCart} />}
      {ui.cartDialogOpen && <CartPanel lines={cart.cartLines} orderSent={ui.orderSent} onClose={ui.closeCart} onGoMenu={ui.closeAndGoToMenu} onReturn={ui.returnToMenu} onAdd={ui.addProduct} onChange={cart.changeQuantity} onSubmit={sendOrder} total={cart.total} fulfillment={customer.fulfillment} setFulfillment={customer.setFulfillment} name={customer.name} setName={customer.setName} phone={customer.phone} setPhone={customer.setPhone} address={customer.address} setAddress={customer.setAddress} formError={customer.formError} />}
    </main>
  );
}
