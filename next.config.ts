import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['stripe', 'bcryptjs', 'qrcode'],
};

export default nextConfig;
