import { CAFE } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1200px] px-4 pb-5 pt-5 text-xs text-muted sm:px-8 lg:px-6">
      <span className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/favicon.jpg" alt="" className="size-8 rounded-full border border-accent/40 object-cover" />
        <span>Sushi Bar №1 · {CAFE.city}</span>
      </span>
    </footer>
  );
}
