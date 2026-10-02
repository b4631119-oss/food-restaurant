"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { MobileBar } from "@/components/mobile-bar";
import { Toast } from "@/components/toast";
import {
  Bike,
  Check,
  Instagram,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import menuData from "@/data/menu.json";
import { CAFE } from "@/lib/config";
import { money, portionInfo } from "@/lib/format";
import { buildReceipt, buildWhatsAppUrl } from "@/lib/order";
import type { Product } from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { useCustomer } from "@/hooks/use-customer";

const products = menuData.products as Product[];

export function MenuShop() {
  const availableProducts = useMemo(() => products.filter((product) => product.inStock), []);
  const { cartLines, itemCount, total, addProduct: addToCart, changeQuantity, clearCart } = useCart(availableProducts);
  const { name, setName, phone, setPhone, address, setAddress, fulfillment, setFulfillment, formError, setFormError, validateForm } = useCustomer();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Популярное");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");
  const menuListRef = useRef<HTMLDivElement>(null);
  const [orderSent, setOrderSent] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!cartOpen) return;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cartOpen]);

  const categories = ["Популярное", ...menuData.categories];
  const cartDialogOpen = cartOpen && (itemCount > 0 || orderSent);
  const openCart = () => {
    if (itemCount > 0) setCartOpen(true);
  };
  const contactLinks = (
    <>
      <a href={`tel:${CAFE.phoneDigits}`} className="press inline-flex min-h-11 items-center gap-2 font-semibold text-accent"><Phone className="size-4" aria-hidden="true" />{CAFE.phone}</a>
      <a href={CAFE.mapUrl} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center gap-2 font-semibold text-accent"><MapPin className="size-4" aria-hidden="true" />Открыть карту</a>
      <a href={CAFE.instagramUrl} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center gap-2 font-semibold text-accent"><Instagram className="size-4" aria-hidden="true" />Instagram</a>
    </>
  );
  const search = searchQuery.trim().toLocaleLowerCase("ru");
  const visibleProducts = availableProducts.filter((product) => {
    if (search) return `${product.name} ${product.description}`.toLocaleLowerCase("ru").includes(search);
    if (activeCategory === "Популярное") return "popular" in product && product.popular;
    return product.category === activeCategory;
  });

  function selectCategory(category: string) {
    setActiveCategory(category);
    setSearchQuery("");
    window.setTimeout(() => menuListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function addProduct(productId: string) {
    addToCart(productId);
    setOrderSent(false);
    setCartPulse(true);
    window.setTimeout(() => setCartPulse(false), 450);
  }

  function goToMenu() {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    setNotice("Выберите блюда — и оформите заказ в корзине.");
  }

  function startOrder() {
    if (itemCount > 0) setCartOpen(true);
    else goToMenu();
  }

  function sendOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanPhone = phone.trim();
    if (!validateForm()) return;
    if (cartLines.length === 0) {
      setFormError("Корзина пуста. Добавьте блюда из меню.");
      return;
    }

    const receipt = buildReceipt({ cartLines, total, fulfillment, name, phone: cleanPhone, address });
    const whatsappUrl = buildWhatsAppUrl(receipt);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    clearCart();
    setOrderSent(true);
    setFormError("");
  }

  return (
    <main className="min-h-dvh overflow-x-clip pb-20 text-text lg:pb-0">
      <Header itemCount={itemCount} onOpenCart={openCart} />
      <Hero onOrder={startOrder} />

      <section id="menu" className="scroll-mt-16 border-y border-accent/25">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 pb-10 pt-6 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
          <aside className="hidden lg:block">
            <nav className="sticky top-20 flex flex-col gap-1" aria-label="Категории меню">
              {categories.map((category) => (
                <button key={category} type="button" onClick={() => selectCategory(category)} aria-current={activeCategory === category && !searchQuery ? "true" : undefined} className={`press min-h-12 rounded-lg px-4 text-left text-sm font-semibold ${activeCategory === category && !searchQuery ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface hover:text-text"}`}>
                  {category}
                </button>
              ))}
            </nav>
          </aside>
          <div className="min-w-0">
            <div className="category-strip relative -mx-4 mb-4 lg:hidden">
              <nav className="sticky top-16 z-30 border-y border-line bg-background/95 px-4 backdrop-blur" aria-label="Категории меню">
                <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line pr-8">
                  {categories.map((category) => (
                    <button key={category} type="button" onClick={() => selectCategory(category)} aria-current={activeCategory === category && !searchQuery ? "true" : undefined} className={`press min-h-12 shrink-0 border-b-2 px-0 text-sm font-semibold ${activeCategory === category && !searchQuery ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"}`}>
                      {category}
                    </button>
                  ))}
                </div>
              </nav>
            </div>
            <div ref={menuListRef} className="scroll-mt-28 pt-1">
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-surface px-3.5 focus-within:border-accent">
                <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} type="search" placeholder="Найти блюдо" aria-label="Поиск по меню" className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted" />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Очистить поиск" className="grid size-8 shrink-0 place-items-center text-muted hover:text-text"><X className="size-4" aria-hidden="true" /></button>}
              </label>
              <div className="mb-3 mt-4 flex items-center justify-between">
                <h2 className="section-heading font-display text-xl font-medium">{search ? "Результаты поиска" : activeCategory}</h2>
                <span className="text-xs text-muted">{visibleProducts.length} блюд</span>
              </div>
              {visibleProducts.length > 0 ? (
                <div className="menu-grid grid grid-cols-2 items-stretch gap-3">
                  {visibleProducts.map((product) => (
                    <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                      <div className="product-photo relative aspect-[4/3] w-full overflow-hidden bg-surface">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image} alt={`${product.name} — ${product.description}`} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" onError={(event) => { event.currentTarget.closest(".product-photo")?.classList.add("hidden"); event.currentTarget.closest("article")?.classList.add("product-photo-failed"); }} />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
                        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</h3>
                        <p className="line-clamp-2 min-h-8 text-xs leading-4 text-muted">{product.description}</p>
                        <p className="text-xs text-muted">{portionInfo(product)}</p>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                          <span className="text-sm font-semibold text-accent">{money(product.price)}</span>
                          <button type="button" onClick={() => addProduct(product.id)} className="press grid size-11 shrink-0 place-items-center rounded-sm bg-accent text-background hover:bg-accent-hover" aria-label={`Добавить ${product.name} в корзину`}><Plus className="size-5" aria-hidden="true" /></button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">Ничего не найдено. Попробуйте изменить запрос.</p>
              )}
            </div>
          </div>
          <section className="mt-8 grid gap-4 border-t border-line pt-6 md:grid-cols-2 lg:col-start-2" aria-label="Доставка и контакты">
            <div className="rounded-2xl bg-surface p-4">
              <h2 className="flex items-center gap-2 text-base font-semibold"><Bike className="size-5 text-accent" aria-hidden="true" />Доставка</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{CAFE.delivery.time} · минимум {money(CAFE.delivery.minimumOrder)}. Стоимость доставки уточняйте при подтверждении заказа.</p>
              <p className="mt-2 text-sm text-muted">{CAFE.address}, {CAFE.city}</p>
            </div>
            <div className="rounded-2xl bg-surface p-4">
              <h2 className="flex items-center gap-2 text-base font-semibold"><MapPin className="size-5 text-accent" aria-hidden="true" />Контакты</h2>
              <div className="mt-2 flex flex-col items-start gap-1 text-sm">{contactLinks}</div>
            </div>
          </section>
        </div>
      </section>

      <Footer />
      {notice && <Toast message={notice} />}
      {!cartDialogOpen && <MobileBar itemCount={itemCount} total={total} pulse={cartPulse} onOpenCart={openCart} />}
      {cartDialogOpen && (
        <div className="fixed inset-0 z-50 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center sm:p-5 lg:items-stretch lg:justify-end lg:p-0" onClick={() => setCartOpen(false)}>
          <section ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cart-title" className="sheet-enter flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-line bg-panel shadow-2xl outline-none sm:rounded-3xl lg:max-h-none lg:h-full lg:w-[420px] lg:max-w-[420px] lg:rounded-none lg:border-y-0 lg:border-r-0" onClick={(event) => event.stopPropagation()}>
            <header className="flex shrink-0 items-center justify-between border-b border-line bg-panel px-5 py-4 sm:px-6">
              <div><p className="text-xs font-semibold text-accent">Sushi Bar №1</p><h2 id="cart-title" className="section-heading mt-1 text-xl font-extrabold">{orderSent ? "Спасибо за заказ!" : "Ваша корзина"}</h2></div>
              <button type="button" onClick={() => setCartOpen(false)} className="press grid size-11 place-items-center border border-line bg-surface hover:border-accent/40" aria-label="Закрыть корзину"><X className="size-5" aria-hidden="true" /></button>
            </header>
            {orderSent ? (
              <div className="flex flex-col items-center px-6 py-12 text-center"><span className="grid size-16 place-items-center rounded-full bg-accent/10 text-accent"><Check className="size-8" aria-hidden="true" /></span><p className="mt-5 max-w-sm leading-relaxed text-muted">Мы подготовили сообщение для WhatsApp. Отправьте его в открывшемся чате — кафе подтвердит ваш заказ.</p><a href={`https://wa.me/${CAFE.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="press mt-6 inline-flex min-h-12 items-center gap-2 rounded-sm bg-accent px-5 font-semibold text-background hover:bg-accent-hover">Открыть WhatsApp <MessageCircle className="size-4" aria-hidden="true" /></a><button type="button" onClick={() => { setOrderSent(false); setCartOpen(false); }} className="mt-4 py-2 text-sm font-semibold text-muted hover:text-text">Вернуться к меню</button></div>
            ) : cartLines.length === 0 ? (
              <div className="px-6 py-10 text-center"><ShoppingBag className="mx-auto size-9 text-accent" aria-hidden="true" /><p className="mt-4 font-bold">Корзина пока пуста</p><p className="mt-1 text-sm text-muted">Добавьте блюда из меню — они появятся здесь.</p><button type="button" onClick={() => { setCartOpen(false); goToMenu(); }} className="press mt-5 rounded-xl bg-accent px-5 py-3 font-bold text-background hover:bg-accent-hover">К меню</button></div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6" aria-label="Список блюд в корзине">
                  <div className="space-y-2">
                    {cartLines.map(({ product, quantity }) => (
                      <div key={product.id} className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" onError={(event) => { event.currentTarget.classList.add("hidden"); event.currentTarget.nextElementSibling?.classList.replace("hidden", "flex"); }} />
                        <div className="photo-placeholder hidden size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/images/favicon.jpg" alt="" className="size-full object-cover opacity-25" />
                        </div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{product.name}</p><p className="mt-1 text-xs text-muted">{money(product.price)} за шт.</p></div>
                        <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => changeQuantity(product.id, -1)} className="press grid size-11 place-items-center rounded-full border border-line text-muted hover:border-accent/50 hover:text-text" aria-label={`Убрать один: ${product.name}`}><Minus className="size-4" aria-hidden="true" /></button><span className="min-w-5 text-center text-sm font-bold">{quantity}</span><button type="button" onClick={() => addProduct(product.id)} className="press grid size-11 place-items-center rounded-full bg-accent text-background hover:bg-accent-hover" aria-label={`Добавить один: ${product.name}`}><Plus className="size-4" aria-hidden="true" /></button></div>
                        <span className="hidden min-w-20 text-right text-sm font-bold text-accent min-[480px]:block">{money(product.price * quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={sendOrder} className="shrink-0 space-y-2 border-t border-line bg-panel px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 sm:px-6">
                  <fieldset><legend className="mb-1.5 text-xs font-bold">Как получить заказ?</legend><div className="flex rounded-xl border border-line bg-surface p-1"><button type="button" onClick={() => setFulfillment("delivery")} aria-pressed={fulfillment === "delivery"} className={`press flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "delivery" ? "bg-accent text-background" : "text-muted hover:text-text"}`}><Bike className="size-4" aria-hidden="true" />Доставка</button><button type="button" onClick={() => setFulfillment("pickup")} aria-pressed={fulfillment === "pickup"} className={`press flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "pickup" ? "bg-accent text-background" : "text-muted hover:text-text"}`}><Store className="size-4" aria-hidden="true" />Самовывоз</button></div></fieldset>
                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                    <label className="block text-xs font-semibold">Ваше имя<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Как к вам обращаться?" className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-base font-normal outline-none placeholder:text-muted/70 focus:border-accent" /></label>
                    <label className="block text-xs font-semibold">Телефон<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="+996 ..." className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-base font-normal outline-none placeholder:text-muted/70 focus:border-accent" /></label>
                  </div>
                  {fulfillment === "delivery" && <label className="block text-xs font-semibold">Адрес доставки<textarea value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" rows={1} placeholder="Улица, дом, квартира, ориентир" className="mt-1 h-10 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-base font-normal outline-none placeholder:text-muted/70 focus:border-accent" /></label>}
                  {formError && <p role="alert" className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm text-text">{formError}</p>}
                  <div className="flex items-center justify-between border-t border-line pt-2"><span className="text-sm font-semibold text-muted">Итого</span><span className="text-lg font-extrabold text-accent">{money(total)}</span></div>
                  <button type="submit" className="press flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 font-bold text-background hover:bg-accent-hover"><MessageCircle className="size-5" aria-hidden="true" />Оформить в WhatsApp</button>
                  <p className="text-center text-[10px] leading-tight text-muted">Сообщение откроется в WhatsApp. Заказ будет подтверждён после отправки сообщения.</p>
                </form>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
