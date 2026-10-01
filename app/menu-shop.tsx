"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  Bike,
  Check,
  Clock3,
  Instagram,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
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
  const [activeCategory, setActiveCategory] = useState(menuData.categories[0] ?? "");
  const [notice, setNotice] = useState("");
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
    <main className="min-h-dvh overflow-x-hidden pb-28 text-text">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-8 sm:py-7 lg:px-12">
        <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={`${CAFE.name} — главная`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/favicon.jpg" alt="" className="size-10 shrink-0 rounded-full border border-accent/50 object-cover" />
          <span className="min-w-0">
            <span className="block truncate font-bold leading-tight">Sushi Bar №1</span>
            <span className="mt-0.5 block text-xs text-muted">Суши-кафе · {CAFE.city}</span>
          </span>
        </a>
        <button
          type="button"
          onClick={startOrder}
          className="press inline-flex min-h-11 shrink-0 items-center gap-2 border-b border-transparent px-2 text-sm font-semibold hover:border-accent"
          aria-label={`Открыть корзину, ${itemCount} товаров`}
        >
          <ShoppingBag className="size-4 text-accent" aria-hidden="true" />
          <span>Корзина</span>
          <span className="grid min-w-6 place-items-center text-xs font-semibold text-accent">{itemCount}</span>
        </button>
      </header>

      <section id="top" className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-12 lg:py-24">
        <div className="relative z-10">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[.22em] text-muted">
            <span className="h-px w-8 bg-accent" /> Свежие ингредиенты · Готовим к заказу
          </p>
          <h1 className="mt-7 max-w-2xl font-display text-5xl font-medium leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Sushi Bar №1<span className="text-accent">.</span>
          </h1>
          
          <div className="mt-8 h-px w-16 bg-accent" aria-hidden="true" />
          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
            <button type="button" onClick={startOrder} className="press accent-shadow inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-accent px-6 font-semibold text-background hover:bg-accent-hover">
              <MessageCircle className="size-5" aria-hidden="true" /> Заказать в WhatsApp
            </button>
            <a href={`tel:${CAFE.phoneDigits}`} className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-line bg-surface px-6 font-semibold hover:border-accent/50">
              <span className="text-accent">↗</span> Позвонить
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-accent" aria-hidden="true" />Сегодня до 01:00</span>
            <span className="inline-flex items-center gap-2"><Bike className="size-4 text-accent" aria-hidden="true" />Доставка и самовывоз</span>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-5 py-4 lg:pl-5">
          <div className="hero-logo-frame grid size-36 place-items-center overflow-hidden rounded-full sm:size-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/favicon.jpg" alt="Логотип Sushi Bar №1" className="size-full rounded-full object-cover" />
          </div>
          <p className="text-center font-display text-lg text-muted sm:text-xl">{CAFE.slogan}</p>
        </div>
      </section>

      <section id="menu" className="scroll-mt-4 border-y border-accent/25">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[.22em] text-accent">Вкус Оша</p><h2 className="section-heading mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">Наше меню</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">Выбирайте любимое — каждое блюдо приготовим свежим к вашему заказу.</p></div>
            <span className="hidden items-center gap-2 pb-1 text-sm text-muted sm:flex"><ArrowDown className="size-4 text-accent" aria-hidden="true" />Листайте и выбирайте</span>
          </div>

          <nav className="sticky top-0 z-20 -mx-4 mt-8 border-y border-line bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0" aria-label="Категории меню">
            <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line sm:flex-wrap sm:gap-8">
              {menuData.categories.map((category) => (
                <button key={category} type="button" onClick={() => { setActiveCategory(category); document.getElementById(`category-${category}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} aria-current={activeCategory === category ? "true" : undefined} className={`press relative shrink-0 border-b-2 border-x-0 border-t-0 px-0 py-3 text-sm font-semibold ${activeCategory === category ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"}`}>
                  {category}
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-8 space-y-12 sm:mt-10 sm:space-y-14">
            {menuData.categories.map((category) => {
              const categoryProducts = availableProducts.filter((product) => product.category === category);
              return (
                <section key={category} id={`category-${category}`} className="scroll-mt-24 border-t border-accent/20 pt-5">
                  <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                    <h3 className="font-display text-xl font-medium sm:text-2xl">{category}</h3>
                    <span className="text-xs text-muted">{categoryProducts.length} позиций</span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categoryProducts.map((product) => (
                      <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-line bg-surface transition-colors duration-200 hover:border-accent/40">
                        <div className="relative w-full shrink-0 overflow-hidden bg-surface">
                          {product.image.toLowerCase().endsWith(".svg") ? (
                            <div className="photo-placeholder relative flex aspect-[4/3] items-center justify-center" aria-hidden="true">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/images/favicon.jpg" alt="" className="absolute size-full object-cover opacity-25" />
                            </div>
                          ) : (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={product.image} alt="" loading="lazy" className="aspect-[4/3] size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" onError={(event) => { event.currentTarget.classList.add("hidden"); event.currentTarget.nextElementSibling?.classList.replace("hidden", "flex"); }} />
                              <div className="photo-placeholder absolute inset-0 hidden items-center justify-center" aria-hidden="true">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/favicon.jpg" alt="" className="size-full object-cover opacity-25" />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:min-h-36 sm:p-5">
                          <div><h4 className="font-bold leading-snug">{product.name}</h4><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted sm:text-[13px]">{product.description}</p></div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-accent">{money(product.price)}</span>
                            <button type="button" onClick={() => addProduct(product.id)} className="press grid size-11 shrink-0 place-items-center rounded-sm bg-accent text-background hover:bg-accent-hover" aria-label={`Добавить ${product.name} в корзину`}><Plus className="size-5" aria-hidden="true" /></button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section id="delivery" className="mx-auto w-full max-w-7xl border-t border-accent/25 px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid gap-5 sm:grid-cols-2">
          <article className="border border-line bg-surface p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl border border-line bg-accent/10 text-accent"><Bike className="size-6" aria-hidden="true" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-accent">Доставка</p>
            <h2 className="section-heading mt-2 font-display text-2xl font-medium">Вкусное уже в пути</h2>
            <p className="mt-3 leading-relaxed text-muted">Ориентировочное время доставки — <strong className="text-text">{CAFE.delivery.time}</strong>. Заказ можно забрать самостоятельно.</p>
          </article>
          <article className="border border-line bg-surface p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl border border-line bg-accent/10 text-accent"><ShoppingBag className="size-6" aria-hidden="true" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-accent">Условия</p>
            <h2 className="section-heading mt-2 font-display text-2xl font-medium">Минимальный заказ</h2>
            <p className="mt-3 leading-relaxed text-muted">Для доставки минимальная сумма заказа — <strong className="text-text">{money(CAFE.delivery.minimumOrder)}</strong>. Стоимость доставки уточним при подтверждении.</p>
          </article>
        </div>
      </section>

      <section id="contacts" className="border-t border-accent/25">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.22em] text-accent">Будем рады вас видеть</p><h2 className="section-heading mt-2 font-display text-3xl font-medium sm:text-4xl">Контакты</h2><p className="mt-3 text-muted">Звоните, пишите или заглядывайте к нам.</p></div>
            <div className="grid gap-3 min-[480px]:grid-cols-2">
              <a href={CAFE.mapUrl} target="_blank" rel="noopener noreferrer" className="press rounded-2xl border border-line bg-surface p-4 hover:border-accent/40"><MapPin className="size-5 text-accent" aria-hidden="true" /><span className="mt-3 block text-xs text-muted">Адрес</span><span className="mt-1 block font-semibold">{CAFE.address}, {CAFE.city}</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent">Как проехать <ArrowLeft className="size-3 rotate-180" aria-hidden="true" /></span></a>
              <div className="rounded-2xl border border-line bg-surface p-4"><Clock3 className="size-5 text-accent" aria-hidden="true" /><span className="mt-3 block text-xs text-muted">Ежедневно</span><span className="mt-1 block font-semibold">{CAFE.openingHours}</span><span className="mt-2 block text-xs text-muted">Ждём вас каждый день</span></div>
              <a href={`tel:${CAFE.phoneDigits}`} className="press rounded-2xl border border-line bg-surface p-4 hover:border-accent/40"><span className="grid size-8 place-items-center rounded-full bg-accent/10 text-accent">↗</span><span className="mt-3 block text-xs text-muted">Телефон и заказы</span><span className="mt-1 block font-semibold">{CAFE.phone}</span></a>
              <a href={CAFE.instagramUrl} target="_blank" rel="noopener noreferrer" className="press rounded-2xl border border-line bg-surface p-4 hover:border-accent/40"><Instagram className="size-5 text-accent" aria-hidden="true" /><span className="mt-3 block text-xs text-muted">Мы в Instagram</span><span className="mt-1 block font-semibold">@{CAFE.instagramHandle}</span></a>
            </div>
          </div>
          <footer className="mt-12 flex flex-col gap-3 border-t border-accent/25 pt-5 text-xs text-muted min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between"><span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/favicon.jpg" alt="" className="size-8 rounded-full border border-accent/40 object-cover" />
            <span>Sushi Bar №1 · {CAFE.city}</span>
          </span><span>Свежие роллы и суши в Оше</span></footer>
        </div>
      </section>

      {notice && <div role="status" className="fixed inset-x-4 bottom-24 z-40 mx-auto w-fit max-w-[calc(100%-2rem)] border border-line bg-surface px-4 py-3 text-center text-sm shadow-lg">{notice}</div>}

      {itemCount > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 safe-bottom border-t border-accent/25 bg-background/95 px-4 pb-3 pt-3 backdrop-blur">
          <button type="button" onClick={() => setCartOpen(true)} className={`press accent-shadow mx-auto flex min-h-14 w-full max-w-xl items-center justify-center gap-3 rounded-2xl bg-accent px-5 text-center font-bold text-background hover:bg-accent-hover ${cartPulse ? "cart-pulse" : ""}`}>
            <ShoppingBag className="size-5 shrink-0" aria-hidden="true" />
            <span>Корзина · {itemCount} · {money(total)}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center sm:p-5" onClick={() => setCartOpen(false)}>
          <section ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cart-title" className="sheet-enter flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-line bg-panel shadow-2xl outline-none sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
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
                        {product.image.toLowerCase().endsWith(".svg") ? (
                          <div className="photo-placeholder relative size-14 shrink-0 overflow-hidden rounded-xl" aria-hidden="true">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/favicon.jpg" alt="" className="size-full object-cover opacity-25" />
                          </div>
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" onError={(event) => { event.currentTarget.classList.add("hidden"); event.currentTarget.nextElementSibling?.classList.replace("hidden", "flex"); }} />
                            <div className="photo-placeholder hidden size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl" aria-hidden="true">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/images/favicon.jpg" alt="" className="size-full object-cover opacity-25" />
                            </div>
                          </>
                        )}
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
