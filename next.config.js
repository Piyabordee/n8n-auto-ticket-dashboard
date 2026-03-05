/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify is now default in Next.js 16, no need to specify
  turbopack: {}, // Enable Turbopack with default config (Next.js 16+)
}

module.exports = nextConfig
