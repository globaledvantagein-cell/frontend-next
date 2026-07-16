import type { NextConfig } from "next";

// Where the Express backend lives. Server components fetch this directly
// (server-to-server); the browser hits the /api rewrite below.
const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:3000";

const nextConfig: NextConfig = {
  // Standalone output for production deployment (pm2 / docker).
  output: "standalone",

  // Proxy all /api/* calls from the browser to the Express backend so the
  // existing relative-path fetches in utils/jobApi.ts keep working unchanged.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` },
    ];
  },

  images: {
    // Company logos / avatars can come from anywhere; keep it permissive.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
