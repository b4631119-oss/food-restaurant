import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl" aria-hidden="true">🔍</span>
        <h1 className="text-xl font-extrabold">Страница не найдена</h1>
        <p className="text-sm text-muted">Проверьте ссылку или вернитесь в меню.</p>
        <Link
          href="/"
          className="press mt-2 rounded-xl bg-accent px-5 py-2.5 font-bold text-background hover:bg-accent-hover"
        >
          В меню
        </Link>
      </div>
    </main>
  );
}
