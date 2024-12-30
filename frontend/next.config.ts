import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
        protocol: 'http',
      },
      {
        hostname: 'example.com',
        protocol: 'https',
      },
      {
        hostname: 'adora.baby',
        protocol: 'https',
      },
    ],
  },

};

export default nextConfig;
