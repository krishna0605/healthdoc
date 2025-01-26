import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true, // Temporarily disabled to avoid config warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
