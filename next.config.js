/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained build for minimal container images.
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  webpack: (config) => {
    // Browser polyfills for Solana/crypto packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };
    // pino-pretty is an optional CLI dep pulled in by WalletConnect — not needed in browser
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      encoding: false,
    };
    return config;
  },
};

module.exports = nextConfig;
