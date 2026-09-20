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
