import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles output automatically - do not use "standalone"
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
