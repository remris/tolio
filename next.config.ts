import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.178.33'],
};

export default nextConfig;
