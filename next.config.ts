import type { NextConfig } from "next";

// The backend lives on a different site (onrender.com vs vercel.app), so its
// auth cookie is "third-party" from the browser's point of view — Safari's
// ITP and Chrome's third-party-cookie phase-out block/partition it even with
// SameSite=None; Secure set correctly. Proxying /api/* through this same
// Next.js origin makes every request same-origin, so the cookie is first-party
// and immune to that blocking.
const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_URL_PROD || "https://allynq-backend.onrender.com"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  // The Playwright suite (e2e/) writes traces, videos and sessions while it runs; watching it
  // would make the dev server rebuild mid-test and serve half-written chunks.
  // `next build` runs Turbopack, which doesn't need the hook below.
  turbopack: {},
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**", "**/e2e/**"],
      };
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: "/onboarding/verify",
        destination: "/dashboard/efootball/profile",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
