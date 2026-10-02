import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Production nginx owns the proxy. Rewrites apply only to the local dev server.
  ...(process.env.NODE_ENV === "development"
    ? {
        async rewrites() {
          const upstream =
            process.env.BACKEND_BASE_URL || "http://backend:8081";
          return [
            {
              source: "/api/v1/:path*",
              destination: `${upstream}/api/v1/:path*`,
            },
          ];
        },
      }
    : {}),
};
export default nextConfig;
