import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://fotoflo.co',
  },
  serverExternalPackages: ['sharp'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
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
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://cjlhuplhgfnybjnzvctv.supabase.co https://*.supabase.co; connect-src 'self' https://cjlhuplhgfnybjnzvctv.supabase.co https://*.supabase.co wss://cjlhuplhgfnybjnzvctv.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cjlhuplhgfnybjnzvctv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cjlhuplhgfnybjnzvctv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn1.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn2.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn3.gstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
