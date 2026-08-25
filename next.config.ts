import type { NextConfig } from "next";

const brandRewrites = [
  "bccwa-logo.jpg",
  "logo.jpg",
  "favicon.png",
  "icon.png",
  "community-hero-group.jpg",
  "story-prayer.png",
  "story-cultural.png",
  "story-learning.png",
  "our-work-community.jpg",
  "about-community-australia.webp",
  "community-story-faith.jpg",
  "community-story-culture.jpg",
  "community-story-care.jpg",
  "it-solutions-zone-logo.png",
  "og-australian-spirit.png",
].map((name) => ({
  source: `/${name}`,
  destination: `/_next/static/brand/${name}`,
}));

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mysql2"],
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "object-src 'none'",
              "img-src 'self' data: blob: https://www.facebook.com https://www.tiktok.com https://i.ytimg.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              isDev
                ? "connect-src 'self' ws: wss:"
                : "connect-src 'self'",
              "frame-src https://www.facebook.com https://web.facebook.com https://www.tiktok.com https://www.youtube.com https://www.youtube-nocookie.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      ...brandRewrites,
      { source: "/api/brand/logo", destination: "/_next/static/brand/bccwa-logo.jpg" },
      { source: "/api/brand/favicon", destination: "/_next/static/brand/favicon.png" },
    ];
  },
};

export default nextConfig;
