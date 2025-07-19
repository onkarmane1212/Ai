/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fixes npm packages that depend on `undici` package
    config.externals = [...(config.externals || []), 'undici'];
    return config;
  },
  experimental: {
    esmExternals: 'loose',
  },
  // Disable React StrictMode for now to avoid issues with undici
  reactStrictMode: false,
};

module.exports = nextConfig;
