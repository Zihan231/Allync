import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

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
  async redirects() {
    return [
      {
        source: "/onboarding/verify",
        destination: "/dashboard/profile",
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

/**
 * `next dev --webpack` only: don't watch the Playwright suite (e2e/), which writes traces,
 * videos and sessions while it runs; watching it rebuilds the app mid-test and serves
 * half-written chunks. Production builds (Turbopack, e.g. on Vercel) get the plain config.
 */
export default function config(phase: string): NextConfig {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;
  return {
    ...nextConfig,
    webpack(webpackConfig) {
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**", "**/e2e/**"],
      };
      return webpackConfig;
    },
  };
}
