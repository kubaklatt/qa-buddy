import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,

  // Optimize for development speed
  experimental: {
    // Optimize package imports - reduces bundle size and improves HMR
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
  },

  // External packages for server components
  serverExternalPackages: ['@supabase/supabase-js'],

  // Reduce logging in dev mode
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
