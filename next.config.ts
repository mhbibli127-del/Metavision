import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    middlewareToProxyDeprecation: false,
  },
};

export default nextConfig;
