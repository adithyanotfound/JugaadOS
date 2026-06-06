import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  // Needed for mongoose in Next.js 16
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
