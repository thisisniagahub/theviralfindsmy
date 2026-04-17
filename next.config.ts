import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development'

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' ${isDev ? "'unsafe-inline' " : ''}${isDev ? "'unsafe-eval' " : ''}https://cdn.jsdelivr.net`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' ${isDev ? 'http://127.0.0.1:3004 http://127.0.0.1:3005 ' : ''}https://operator.gangniaga.my wss://operator.gangniaga.my https://shopee.gangniaga.my wss://shopee.gangniaga.my`,
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // Vercel handles output automatically - do not use "standalone"
  typescript: {
    ignoreBuildErrors: false, // Pre-existing TypeScript errors (Phaser 4 API changes)
  },
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Shopee product images (specific CDN domains only)
      {
        protocol: 'https',
        hostname: 'cf.shopee.com.my',
        pathname: '/file/**',
      },
      {
        protocol: 'https',
        hostname: 'down-my.img.susercontent.com',
        pathname: '/my/**',
      },
      {
        protocol: 'https',
        hostname: 'cf.shopee.sg',
        pathname: '/file/**',
      },
      {
        protocol: 'https',
        hostname: 'down-sg.img.susercontent.com',
        pathname: '/sg/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
