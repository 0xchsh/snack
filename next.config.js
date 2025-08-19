/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    // Type checking happens in CI/build process
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint checking happens in CI/build process
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig