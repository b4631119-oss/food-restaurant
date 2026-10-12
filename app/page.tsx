import type { Metadata } from "next";
import { MenuShop } from "@/components/menu-shop";

// Имя сайта на домашнем экране iOS. Задаётся здесь, а не в корневом layout:
// иначе тег попадает и в /admin, где Safari берёт первое значение и показывает имя сайта
// вместо «Админка». Раньше это был ручной <meta> в <head> корневого layout.
export const metadata: Metadata = {
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Суши Бар №1" },
};

export default function Home() {
  return <MenuShop />;
}
