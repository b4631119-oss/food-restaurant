import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CAFE } from "@/lib/config";
import { ServiceWorkerRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sushi-bar-no1.vercel.app"),
  title: {
    default: `${CAFE.name} — суши и роллы в Оше`,
    template: `%s | ${CAFE.name}`,
  },
  description: `${CAFE.slogan}. Адрес: ${CAFE.address}, ${CAFE.city}. Заказы: ${CAFE.phone}.`,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Суши Бар №1",
  },
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
    icon: [
      { url: "/images/favicon.jpg" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Суши Бар №1" />
      </head>
      <body className="min-h-dvh bg-background font-sans text-text antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
