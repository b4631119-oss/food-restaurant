import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CAFE } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${CAFE.name} — суши и роллы в Оше`,
    template: `%s | ${CAFE.name}`,
  },
  description: `${CAFE.slogan}. Адрес: ${CAFE.address}, ${CAFE.city}. Заказы: ${CAFE.phone}.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1220",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="min-h-dvh bg-background font-sans text-text antialiased">{children}</body>
    </html>
  );
}
