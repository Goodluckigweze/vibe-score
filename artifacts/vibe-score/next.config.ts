import type { NextConfig } from "next";

const configuredBasePath = process.env.BASE_PATH?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: configuredBasePath || undefined,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;