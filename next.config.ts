import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: false,
  },
  // Server external packages untuk Next.js 16
  // Package ini akan di-external-kan dan tidak di-bundle
  serverExternalPackages: ['sharp', 'qrcode', 'xlsx'],
  // Increase body size limit untuk Server Actions (untuk upload gambar)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
