import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // The kamatz/patach world moved into the nikud engine (one route for every vowel world).
  async redirects() {
    return [
      { source: "/play/kamatz-patach", destination: "/play/nikud/kamatz-patach", permanent: false },
      { source: "/play/kamatz-patach/:station", destination: "/play/nikud/kamatz-patach/:station", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
