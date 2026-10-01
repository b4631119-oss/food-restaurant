"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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

type Product = (typeof menuData.products)[number];
type Fulfillment = "delivery" | "pickup";
type Cart = Record<string, number>;

const CART_KEY = "sushi-bar-no1-cart";
const products = menuData.products as Product[];

function money(amount: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${CAFE.currency}`;
}

function readCart(): Cart {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const next: Cart = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (products.some((product) => product.id === id && product.inStock) && Number.isInteger(value) && Number(value) > 0) {
        next[id] = Number(value);
      }
    }
    return next;
  } catch {
    return {};
  }
}

export function MenuShop() {
  const [cart, setCart] = useState<Cart>({});
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Популярное");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");
  const menuListRef = useRef<HTMLDivElement>(null);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState("");
  const [orderSent, setOrderSent] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCart(readCart());
      setCartReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Keep the cart usable for this visit if storage is unavailable.
    }
  }, [cart, cartReady]);

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

  const availableProducts = useMemo(() => products.filter((product) => product.inStock), []);
  const cartLines = useMemo(
    () => availableProducts
      .filter((product) => (cart[product.id] ?? 0) > 0)
      .map((product) => ({ product, quantity: cart[product.id] })),
    [availableProducts, cart],
  );
  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const total = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const categories = ["Популярное", ...menuData.categories];
  const cartDialogOpen = cartOpen && (itemCount > 0 || orderSent);
  const openCart = () => {
    if (itemCount > 0) setCartOpen(true);
  };
  const whatsAppIcon = (
    <svg viewBox="0 0 448 512" aria-hidden="true" className="size-5 fill-current">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.5 32 1.9 131.6 1.8 254c0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 222.1-99.6 222.1-222 0-59.3-23.1-115.1-65.1-157Zm-157 341.3c-33.2 0-65.7-8.9-94.1-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.4-28.2-98 0-101.6 82.7-184.3 184.4-184.3 49.2 0 95.5 19.2 130.3 54 34.8 34.8 54 81.1 53.9 130.4 0 101.6-82.8 184.4-184.3 184.4Zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.4 18-17.7 21.7-3.2 3.7-6.5 4.2-12 1.4-32.7-16.3-54.1-29.1-75.6-65.9-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.7 57.4c2.8 3.7 39.1 59.7 94.7 83.7 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.4-5-3.8-10.5-6.5Z" />
    </svg>
  );
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

  function portionInfo(product: Product): string {
    return typeof product.weight === "string" ? product.weight : "";
  }

  function addProduct(productId: string) {
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
    setOrderSent(false);
    setCartPulse(true);
    window.setTimeout(() => setCartPulse(false), 450);
  }

  function changeQuantity(productId: string, amount: number) {
    setCart((current) => {
      const quantity = (current[productId] ?? 0) + amount;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: quantity };
    });
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
    const phoneDigits = cleanPhone.replace(/\D/g, "");
    if (name.trim().length < 2) {
      setFormError("Укажите имя (минимум 2 символа).");
      return;
    }
    if (phoneDigits.length < 7) {
      setFormError("Укажите корректный номер телефона.");
      return;
    }
    if (fulfillment === "delivery" && address.trim().length < 5) {
      setFormError("Укажите адрес доставки подробнее.");
      return;
    }
    if (cartLines.length === 0) {
      setFormError("Корзина пуста. Добавьте блюда из меню.");
      return;
    }

    const receipt = [
      `🍣 Заказ — ${CAFE.name}`,
      "──────────────────",
      ...cartLines.map(({ product, quantity }) => `${quantity} × ${product.name} — ${money(product.price * quantity)}`),
      "──────────────────",
      `Итого: ${money(total)}`,
      `Имя: ${name.trim()}`,
      `Телефон: ${cleanPhone}`,
      `Получение: ${fulfillment === "delivery" ? "Доставка" : "Самовывоз"}`,
      ...(fulfillment === "delivery" ? [`Адрес: ${address.trim()}`] : []),
      "Оплата при получении. Пожалуйста, подтвердите заказ.",
    ].join("\n");

    const whatsappUrl = `https://wa.me/${CAFE.whatsappNumber}?text=${encodeURIComponent(receipt)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setCart({});
    setOrderSent(true);
    setFormError("");
  }

  return (
    <main className="min-h-dvh overflow-x-clip pb-20 text-text lg:pb-0">
      <header className="sticky top-0 z-40 mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 border-b border-line bg-background/95 px-4 py-3 backdrop-blur sm:px-8 lg:px-6">
        <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={`${CAFE.name} — главная`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/favicon.jpg" alt="" className="size-9 shrink-0 rounded-full border border-accent/50 object-cover" />
          <span className="truncate font-bold leading-tight">Sushi Bar №1</span>
        </a>
        <button type="button" onClick={openCart} aria-label={`Открыть корзину, ${itemCount} товаров`} className="press inline-flex min-h-11 shrink-0 items-center gap-2 px-2 text-sm font-semibold">
          <ShoppingBag className="size-4 text-accent" aria-hidden="true" />
          <span>Корзина</span><span className="grid min-w-6 place-items-center text-xs font-semibold text-accent">{itemCount}</span>
        </button>
      </header>

      <section id="top" className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-4 overflow-hidden px-4 py-4 sm:px-8 lg:min-h-[320px] lg:grid-cols-[1fr_300px] lg:gap-6 lg:px-6 lg:py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/menu/roll-philadelphia.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        <div className="relative z-10 flex flex-col items-start gap-4">
          <h1 className="max-w-2xl font-display text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">Свежие суши и роллы в Оше</h1>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-accent"><span className="size-2 rounded-full bg-accent" />Открыто · 10:00-01:00</span>
        </div>
        <div className="relative z-10 hidden justify-self-center lg:flex">
          <div className="hero-logo-frame size-[240px] overflow-hidden rounded-full border-2 border-accent p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/favicon.jpg" alt="Sushi Bar №1" className="size-full rounded-full object-cover" />
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-2 sm:w-[min(100%,420px)]">
          <button type="button" onClick={startOrder} className="press accent-shadow inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-accent px-3 text-sm font-semibold text-background hover:bg-accent-hover">
            <ShoppingBag className="size-4" aria-hidden="true" />Заказать
          </button>
          <a href={`tel:${CAFE.phoneDigits}`} className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface px-3 text-sm font-semibold hover:border-accent/50">
            <Phone className="size-4 text-accent" aria-hidden="true" />Позвонить
          </a>
        </div>
      </section>

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

      <footer className="mx-auto w-full max-w-[1200px] px-4 pb-5 pt-5 text-xs text-muted sm:px-8 lg:px-6">
        <span className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/favicon.jpg" alt="" className="size-8 rounded-full border border-accent/40 object-cover" />
          <span>Sushi Bar №1 · {CAFE.city}</span>
        </span>
      </footer>

      {notice && <div role="status" className="fixed inset-x-4 bottom-20 z-40 mx-auto w-fit max-w-[calc(100%-2rem)] border border-line bg-surface px-4 py-3 text-center text-sm shadow-lg lg:bottom-4">{notice}</div>}

      {!cartDialogOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 safe-bottom border-t border-accent/25 bg-background/95 px-2 pt-2 backdrop-blur lg:hidden">
          <div className={`mx-auto grid w-full max-w-2xl gap-2 ${itemCount > 0 ? "grid-cols-[auto_auto_minmax(0,1fr)]" : "grid-cols-[auto_auto] justify-center"}`}>
            <a href={`tel:${CAFE.phoneDigits}`} aria-label="Позвонить" className="press grid size-12 place-items-center rounded-xl border border-line bg-surface text-accent"><Phone className="size-5" aria-hidden="true" /></a>
            <a href={`https://wa.me/${CAFE.whatsappNumber}`} target="_blank" rel="noopener noreferrer" aria-label="Написать в WhatsApp" className="press grid size-12 place-items-center rounded-xl border border-line bg-surface text-accent">{whatsAppIcon}</a>
            {itemCount > 0 && (
              <button type="button" onClick={openCart} className={`press accent-shadow flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-background hover:bg-accent-hover ${cartPulse ? "cart-pulse" : ""}`}>
                <span className="flex min-w-0 items-center gap-2"><ShoppingBag className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">Корзина · {itemCount}</span></span>
                <span className="shrink-0">{money(total)}</span>
              </button>
            )}
          </div>
        </div>
      )}
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
