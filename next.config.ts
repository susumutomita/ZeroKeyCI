import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@qdrant/js-client-rest"],
};

export default nextConfig;
