import type { Metadata } from "next";
import Link from "next/link";
import { CAFE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: `Политика конфиденциальности ${CAFE.name}: какие данные собираются при оформлении заказа и как они используются.`,
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-8">
      <Link
        href="/"
        className="press inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-accent underline-offset-2 hover:underline"
      >
        ← Вернуться в меню
      </Link>
      <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
        Политика конфиденциальности
      </h1>
      <p className="mt-2 text-sm text-muted">{CAFE.name} · {CAFE.city}</p>

      <div className="mt-8 space-y-7 text-[15px] leading-relaxed">
        <section>
          <h2 className="section-heading text-lg font-semibold text-text">1. Какие данные мы получаем</h2>
          <p className="mt-3 text-muted">
            При оформлении заказа на сайте вы сами указываете данные, необходимые для его выполнения:
            имя, номер телефона, адрес доставки и комментарий к заказу. Состав заказа (выбранные блюда
            и их количество) формируется из вашей корзины.
          </p>
        </section>

        <section>
          <h2 className="section-heading text-lg font-semibold text-text">2. Где хранятся данные</h2>
          <p className="mt-3 text-muted">
            Сведения о заказах сохраняются в базе данных Firebase/Firestore и используются для обработки
            заказа и связи с вами по нему. Фотографии блюд в меню размещаются через сервис Cloudinary.
          </p>
        </section>

        <section>
          <h2 className="section-heading text-lg font-semibold text-text">3. WhatsApp</h2>
          <p className="mt-3 text-muted">
            После оформления заказа сайт формирует текст заказа и открывает WhatsApp, чтобы вы могли
            отправить его кафе. При этом действуют правила обработки данных WhatsApp как отдельного сервиса.
          </p>
        </section>

        <section>
          <h2 className="section-heading text-lg font-semibold text-text">4. Как используются данные</h2>
          <p className="mt-3 text-muted">
            Данные используются только для обработки заказов и связи с клиентами: подтверждения заказа,
            уточнения деталей доставки и информирования о его статусе.
          </p>
        </section>

        <section>
          <h2 className="section-heading text-lg font-semibold text-text">5. Контакты</h2>
          <p className="mt-3 text-muted">
            По вопросам, связанным с вашими данными и заказами, обращайтесь: {CAFE.name}, {CAFE.city},{" "}
            {CAFE.address}, телефон{" "}
            <a href={`tel:${CAFE.phone.replace(/\D/g, "")}`} className="font-semibold text-accent underline-offset-2 hover:underline">
              {CAFE.phone}
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
