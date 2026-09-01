import type { NextConfig } from "next";

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
};

export default nextConfig;
