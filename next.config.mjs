/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate SSE connects in development
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@google/generative-ai'],
  },
};

export default nextConfig;
