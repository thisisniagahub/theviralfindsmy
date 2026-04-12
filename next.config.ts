import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles output automatically - do not use "standalone"
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.shopee.**',
      },
      {
        protocol: 'https',
        hostname: 'cf.shopee.**',
      },
    ],
  },
};

export default nextConfig;
