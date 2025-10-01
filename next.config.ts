import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingIncludes: {
    '/(dashboard)': ['./app/(dashboard)/**/*'],
  },
};

export default nextConfig;
