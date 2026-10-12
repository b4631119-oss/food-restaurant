import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Админка | Sushi Bar №1",
  // Админка не индексируется; отдельный манифест и иконки — своё устанавливаемое приложение.
  robots: { index: false, follow: false, noarchive: true },
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "Админка", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icons/admin-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/admin-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/admin-apple-touch-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
