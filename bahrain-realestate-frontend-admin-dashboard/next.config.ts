import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Disable X-Powered-By header for security
  poweredByHeader: false,

  // Standalone output for Docker / self-hosted deployments
  output: "standalone",

  // Allowed remote image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
