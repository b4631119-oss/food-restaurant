import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CAFE } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${CAFE.name} — суши и роллы в Оше`,
    template: `%s | ${CAFE.name}`,
  },
  description: `Меню суши-кафе ${CAFE.name}. ${CAFE.address}, ${CAFE.city}. Заказы по телефону ${CAFE.phone}.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF7F0",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="min-h-dvh bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
