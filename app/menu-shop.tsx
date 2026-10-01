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
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={`${CAFE.name} — главная`}>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
            <span className="font-serif text-xl font-bold">S</span>
          </span>
          <span className="min-w-0">
            <span className="block truncate font-bold leading-tight">{CAFE.name}</span>
            <span className="mt-0.5 block text-xs text-muted">Суши-кафе · {CAFE.city}</span>
          </span>
        </a>
        <button
          type="button"
          onClick={startOrder}
          className="press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:border-gold/60"
          aria-label={`Открыть корзину, ${itemCount} товаров`}
        >
          <ShoppingBag className="size-4 text-gold" aria-hidden="true" />
          <span>Корзина</span>
          <span className="grid min-w-6 place-items-center rounded-full bg-gold px-1.5 py-0.5 text-xs font-bold text-[#0b1220]">{itemCount}</span>
        </button>
      </header>

      <section id="top" className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.06fr_.94fr] lg:items-center lg:px-8 lg:py-20">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-gold">
            <span className="size-1.5 rounded-full bg-gold" /> Свежие ингредиенты · Готовим к заказу
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            {CAFE.name}<span className="text-gold">.</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted sm:text-xl">{CAFE.slogan}</p>
          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
            <button type="button" onClick={startOrder} className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-5 font-bold text-[#111827] shadow-[0_10px_32px_rgb(201_162_75/0.18)] hover:bg-[#d6b564]">
              <MessageCircle className="size-5" aria-hidden="true" /> Заказать в WhatsApp
            </button>
            <a href={`tel:${CAFE.phoneDigits}`} className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold hover:border-gold/50">
              <span className="text-gold">↗</span> Позвонить
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-gold" aria-hidden="true" />Сегодня до 01:00</span>
            <span className="inline-flex items-center gap-2"><Bike className="size-4 text-gold" aria-hidden="true" />Доставка и самовывоз</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-3 rounded-[2rem] bg-gold/10 blur-2xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-surface p-2 shadow-[0_28px_80px_rgb(0_0_0/0.3)]">
            {/* Static SVG placeholder; replace with cafe photography when available. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/sets.svg" alt="Ассорти роллов и суши" className="aspect-[1.36] w-full rounded-[1.3rem] object-cover" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b1220]/85 p-4 backdrop-blur-md sm:inset-x-7 sm:bottom-7">
              <div><p className="text-xs text-muted">Выбор гостей</p><p className="mt-1 font-bold">Классический сет</p></div>
              <span className="shrink-0 text-sm font-bold text-gold">{money(1190)}</span>
            </div>
          </div>
          <span className="absolute -right-1 -top-3 rounded-full border border-gold/25 bg-surface px-3 py-2 text-xs font-semibold text-gold shadow-lg sm:-right-4">🍣 Свежая рыба</span>
        </div>
      </section>

      <section id="menu" className="scroll-mt-4 border-y border-line/80 bg-[#0e1728]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[.22em] text-gold">Вкус Оша</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Наше меню</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">Выбирайте любимое — каждое блюдо приготовим свежим к вашему заказу.</p></div>
            <span className="hidden items-center gap-2 pb-1 text-sm text-muted sm:flex"><ArrowDown className="size-4 text-gold" aria-hidden="true" />Листайте и выбирайте</span>
          </div>

          <nav className="sticky top-0 z-20 -mx-4 mt-7 border-y border-line bg-[#0e1728]/95 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0" aria-label="Категории меню">
            <div className="no-scrollbar flex gap-2 overflow-x-auto sm:flex-wrap">
              {menuData.categories.map((category) => (
                <button key={category} type="button" onClick={() => { setActiveCategory(category); document.getElementById(`category-${category}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} aria-current={activeCategory === category ? "true" : undefined} className={`press shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold ${activeCategory === category ? "border-gold bg-gold text-[#111827]" : "border-line bg-surface text-muted hover:border-gold/50 hover:text-text"}`}>
                  {category}
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-8 space-y-12 sm:mt-10 sm:space-y-14">
            {menuData.categories.map((category) => {
              const categoryProducts = availableProducts.filter((product) => product.category === category);
              return (
                <section key={category} id={`category-${category}`} className="scroll-mt-24">
                  <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                    <h3 className="text-xl font-bold sm:text-2xl">{category}</h3>
                    <span className="text-xs text-muted">{categoryProducts.length} позиций</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categoryProducts.map((product) => (
                      <article key={product.id} className="group flex min-w-0 gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors duration-200 hover:border-gold/40 min-[480px]:flex-col min-[480px]:gap-0">
                        <div className="relative w-24 shrink-0 overflow-hidden rounded-xl bg-panel min-[480px]:mb-3 min-[480px]:w-full">
                          {/* Static SVG placeholder; each category has its own illustration. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.image} alt="" loading="lazy" className="aspect-square size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] min-[480px]:aspect-[1.38]" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 min-[480px]:min-h-32">
                          <div><h4 className="font-bold leading-snug">{product.name}</h4><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted sm:text-[13px]">{product.description}</p></div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold text-gold">{money(product.price)}</span>
                            <button type="button" onClick={() => addProduct(product.id)} className="press grid size-9 shrink-0 place-items-center rounded-full bg-gold text-[#111827] hover:bg-[#d6b564]" aria-label={`Добавить ${product.name} в корзину`}><Plus className="size-5" aria-hidden="true" /></button>
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

      <section id="delivery" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-3xl border border-gold/20 bg-[linear-gradient(135deg,rgba(201,162,75,.12),rgba(17,26,46,.9))] p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-gold/10 text-gold"><Bike className="size-6" aria-hidden="true" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-gold">Доставка</p>
            <h2 className="mt-2 text-2xl font-extrabold">Вкусное уже в пути</h2>
            <p className="mt-3 leading-relaxed text-muted">Ориентировочное время доставки — <strong className="text-text">{CAFE.delivery.time}</strong>. Заказ можно забрать самостоятельно.</p>
          </article>
          <article className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-gold/10 text-gold"><ShoppingBag className="size-6" aria-hidden="true" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-gold">Условия</p>
            <h2 className="mt-2 text-2xl font-extrabold">Минимальный заказ</h2>
            <p className="mt-3 leading-relaxed text-muted">Для доставки минимальная сумма заказа — <strong className="text-text">{money(CAFE.delivery.minimumOrder)}</strong>. Стоимость доставки уточним при подтверждении.</p>
          </article>
        </div>
      </section>

      <section id="contacts" className="border-t border-line bg-[#0e1728]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.22em] text-gold">Будем рады вас видеть</p><h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Контакты</h2><p className="mt-3 text-muted">Звоните, пишите или заглядывайте к нам.</p></div>
            <div className="grid gap-3 min-[480px]:grid-cols-2">
              <a href={CAFE.mapUrl} target="_blank" rel="noopener noreferrer" className="press rounded-2xl border border-line bg-surface p-4 hover:border-gold/40"><MapPin className="size-5 text-gold" aria-hidden="true" /><span className="mt-3 block text-xs text-muted">Адрес</span><span className="mt-1 block font-semibold">{CAFE.address}, {CAFE.city}</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold">Как проехать <ArrowLeft className="size-3 rotate-180" aria-hidden="true" /></span></a>
              <div className="rounded-2xl border border-line bg-surface p-4"><Clock3 className="size-5 text-gold" aria-hidden="true" /><span className="mt-3 block text-xs text-muted">Ежедневно</span><span className="mt-1 block font-semibold">{CAFE.openingHours}</span><span className="mt-2 block text-xs text-muted">Ждём вас каждый день</span></div>
              <a href={`tel:${CAFE.phoneDigits}`} className="press rounded-2xl border border-line bg-surface p-4 hover:border-gold/40"><span className="grid size-8 place-items-center rounded-full bg-gold/10 text-gold">↗</span><span className="mt-3 block text-xs text-muted">Телефон и заказы</span><span className="mt-1 block font-semibold">{CAFE.phone}</span></a>
              <a href={CAFE.instagramUrl} target="_blank" rel="noopener noreferrer" className="press rounded-2xl border border-line bg-surface p-4 hover:border-gold/40"><Instagram className="size-5 text-gold" aria-hidden="true" /><span className="mt-3 block text-xs text-muted">Мы в Instagram</span><span className="mt-1 block font-semibold">@{CAFE.instagramHandle}</span></a>
            </div>
          </div>
          <footer className="mt-12 flex flex-col gap-2 border-t border-line pt-5 text-xs text-muted min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between"><span>{CAFE.name} · {CAFE.city}</span><span>Свежие роллы и суши в Оше</span></footer>
        </div>
      </section>

      {notice && <div role="status" className="fixed inset-x-4 bottom-24 z-40 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-full border border-gold/30 bg-surface px-4 py-3 text-center text-sm shadow-xl">{notice}</div>}

      {itemCount > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 safe-bottom bg-gradient-to-t from-[#0b1220] via-[#0b1220]/95 to-transparent px-4 pb-3 pt-8">
          <button type="button" onClick={() => setCartOpen(true)} className="press mx-auto flex min-h-14 w-full max-w-xl items-center justify-between gap-3 rounded-2xl bg-gold px-5 text-left font-bold text-[#111827] shadow-[0_12px_38px_rgb(201_162_75/0.24)] hover:bg-[#d6b564]">
            <span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#111827]/10"><ShoppingBag className="size-4" aria-hidden="true" /></span><span>Корзина · {itemCount} {itemCount === 1 ? "блюдо" : itemCount < 5 ? "блюда" : "блюд"}</span></span>
            <span className="shrink-0">{money(total)}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-[2px] sm:items-center sm:p-5" onClick={() => setCartOpen(false)}>
          <section ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cart-title" className="sheet-enter max-h-[94dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-3xl border border-line bg-panel shadow-2xl outline-none sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel/95 px-5 py-4 backdrop-blur sm:px-6">
              <div><p className="text-xs font-semibold text-gold">{CAFE.name}</p><h2 id="cart-title" className="mt-1 text-xl font-extrabold">{orderSent ? "Спасибо за заказ!" : "Ваша корзина"}</h2></div>
              <button type="button" onClick={() => setCartOpen(false)} className="press grid size-10 place-items-center rounded-full border border-line bg-surface hover:border-gold/40" aria-label="Закрыть корзину"><X className="size-5" aria-hidden="true" /></button>
            </header>
            {orderSent ? (
              <div className="flex flex-col items-center px-6 py-12 text-center"><span className="grid size-16 place-items-center rounded-full bg-gold/10 text-gold"><Check className="size-8" aria-hidden="true" /></span><p className="mt-5 max-w-sm leading-relaxed text-muted">Мы подготовили сообщение для WhatsApp. Отправьте его в открывшемся чате — кафе подтвердит ваш заказ.</p><a href={`https://wa.me/${CAFE.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="press mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-5 font-bold text-[#111827]">Открыть WhatsApp <MessageCircle className="size-4" aria-hidden="true" /></a><button type="button" onClick={() => { setOrderSent(false); setCartOpen(false); }} className="mt-4 py-2 text-sm font-semibold text-muted hover:text-text">Вернуться к меню</button></div>
            ) : cartLines.length === 0 ? (
              <div className="px-6 py-12 text-center"><ShoppingBag className="mx-auto size-9 text-gold" aria-hidden="true" /><p className="mt-4 font-bold">Корзина пока пуста</p><p className="mt-1 text-sm text-muted">Добавьте блюда из меню — они появятся здесь.</p><button type="button" onClick={() => { setCartOpen(false); goToMenu(); }} className="press mt-5 rounded-xl bg-gold px-5 py-3 font-bold text-[#111827]">Перейти к меню</button></div>
            ) : (
              <div className="p-4 sm:p-6">
                <div className="space-y-2">
                  {cartLines.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                      {/* Static SVG placeholder; replace when real dish photography is ready. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{product.name}</p><p className="mt-1 text-xs text-muted">{money(product.price)} за шт.</p></div>
                      <div className="flex items-center gap-1.5"><button type="button" onClick={() => changeQuantity(product.id, -1)} className="press grid size-8 place-items-center rounded-full border border-line text-muted hover:text-text" aria-label={`Убрать один: ${product.name}`}><Minus className="size-3.5" aria-hidden="true" /></button><span className="min-w-5 text-center text-sm font-bold">{quantity}</span><button type="button" onClick={() => addProduct(product.id)} className="press grid size-8 place-items-center rounded-full bg-gold text-[#111827] hover:bg-[#d6b564]" aria-label={`Добавить один: ${product.name}`}><Plus className="size-3.5" aria-hidden="true" /></button></div>
                      <span className="hidden min-w-20 text-right text-sm font-bold text-gold min-[420px]:block">{money(product.price * quantity)}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendOrder} className="mt-5 space-y-4">
                  <fieldset><legend className="mb-2 text-sm font-bold">Как получить заказ?</legend><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setFulfillment("delivery")} aria-pressed={fulfillment === "delivery"} className={`press flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${fulfillment === "delivery" ? "border-gold bg-gold/10 text-gold" : "border-line bg-surface text-muted"}`}><Bike className="size-4" aria-hidden="true" />Доставка</button><button type="button" onClick={() => setFulfillment("pickup")} aria-pressed={fulfillment === "pickup"} className={`press flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${fulfillment === "pickup" ? "border-gold bg-gold/10 text-gold" : "border-line bg-surface text-muted"}`}><Store className="size-4" aria-hidden="true" />Самовывоз</button></div></fieldset>
                  <label className="block text-sm font-semibold">Ваше имя<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Как к вам обращаться?" className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-base font-normal outline-none placeholder:text-muted/70 focus:border-gold" /></label>
                  <label className="block text-sm font-semibold">Телефон<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="+996 ..." className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-base font-normal outline-none placeholder:text-muted/70 focus:border-gold" /></label>
                  {fulfillment === "delivery" && <label className="block text-sm font-semibold">Адрес доставки<textarea value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" rows={2} placeholder="Улица, дом, квартира, ориентир" className="mt-1.5 w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-base font-normal outline-none placeholder:text-muted/70 focus:border-gold" /></label>}
                  {formError && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-200">{formError}</p>}
                  <div className="flex items-center justify-between border-t border-line pt-4"><span className="text-sm font-semibold text-muted">Итого</span><span className="text-xl font-extrabold text-gold">{money(total)}</span></div>
                  <button type="submit" className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 font-bold text-[#111827] hover:bg-[#d6b564]"><MessageCircle className="size-5" aria-hidden="true" />Оформить в WhatsApp</button>
                  <p className="text-center text-xs leading-relaxed text-muted">Сообщение откроется в WhatsApp. Заказ будет подтверждён после отправки сообщения.</p>
                </form>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
