import type { NextConfig } from "next";

const ADMIN_HEADERS = [
  // Админка не индексируется и не кэшируется: ответы могут содержать данные заказов.
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      { source: "/admin", headers: ADMIN_HEADERS },
      { source: "/admin/:path*", headers: ADMIN_HEADERS },
    ];
  },
};

export default nextConfig;
