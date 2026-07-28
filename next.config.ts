import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Per-package import optimization — keeps `date-fns` tree-shaken
    // (and any future barrel-heavy deps we add) out of the main bundle.
    optimizePackageImports: ["date-fns"],
  },
  // Modern build target so the browser bundle ships ES2020 syntax.
  // Combined with the `browserslist` field in package.json (which we
  // also added), this defines the lowest-supported browsers.
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

export default nextConfig;
