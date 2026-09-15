/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Configure environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },

  // Enable experimental features if needed
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:8000"],
    },
  },
};

module.exports = nextConfig;
