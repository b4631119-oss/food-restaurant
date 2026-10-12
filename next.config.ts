import type { NextConfig } from "next";

// Базовые заголовки безопасности для всех ответов. CSP здесь не задаётся намеренно:
// её нужно вводить отдельно и проверять, иначе легко сломать инлайновые стили Next.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

// Админка не индексируется и не кэшируется: ответы могут содержать данные заказов.
const ADMIN_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  // Не раскрываем стек и не отдаём карты исходников в браузер.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/admin", headers: ADMIN_HEADERS },
      { source: "/admin/:path*", headers: ADMIN_HEADERS },
    ];
  },
};

export default nextConfig;
