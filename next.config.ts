import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Optional separate build folder, so a test build never clashes with a running `next dev` (default: .next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
