/** @type {import('next').NextConfig} */ const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin();
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        // Allow any hostname for mock and dynamic event images
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
    ],
  },
};
module.exports = withNextIntl(withPWA(nextConfig));
