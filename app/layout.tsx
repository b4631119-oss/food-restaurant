import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CAFE } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sushi-bar-no1.vercel.app"),
  title: {
    default: `${CAFE.name} — суши и роллы в Оше`,
    template: `%s | ${CAFE.name}`,
  },
  description: `${CAFE.slogan}. Адрес: ${CAFE.address}, ${CAFE.city}. Заказы: ${CAFE.phone}.`,
  openGraph: {
    title: `${CAFE.name} — суши и роллы в Оше`,
    description: `${CAFE.slogan}. Заказы: ${CAFE.phone}.`,
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: `${CAFE.name} — суши и роллы в Оше`,
    description: `${CAFE.slogan}. Заказы: ${CAFE.phone}.`,
  },
  icons: {
    icon: "/images/favicon.jpg",
    apple: "/images/favicon.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A1424",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-dvh bg-background font-sans text-text antialiased">{children}</body>
    </html>
  );
}
