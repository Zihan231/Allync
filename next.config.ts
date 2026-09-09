import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/onboarding/verify",
        destination: "/dashboard/efootball/profile",
        permanent: true,
      },
      {
        source: "/dashboard/:section(pubg|freefire|valorant)",
        destination: "/dashboard/efootball",
        permanent: true,
      },
      {
        source: "/dashboard/organizer/:path*",
        destination: "/dashboard/efootball",
        permanent: true,
      },
      {
        source: "/dashboard/organizer",
        destination: "/dashboard/efootball",
        permanent: true,
      },
      {
        source: "/dashboard/efootball/:section(community|store)/:path*",
        destination: "/dashboard/efootball",
        permanent: true,
      },
      {
        source: "/dashboard/efootball/:section(community|store)",
        destination: "/dashboard/efootball",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
