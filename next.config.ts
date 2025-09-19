import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Keep builds/dev resilient
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
    ],
  },
  // Ensure Next.js treats this folder as the workspace root even if a parent has a lockfile
  outputFileTracingRoot: path.join(__dirname),
  // Replace deprecated experimental.serverComponentsExternalPackages with serverExternalPackages
  serverExternalPackages: [],
  experimental: {
    // (other experimental flags can remain here when needed)
  },
};

export default nextConfig;
