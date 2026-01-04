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
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint checking happens in CI/build process
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://fwahxwlbsilzlbgeotyk.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3YWh4d2xic2lsemxiZ2VvdHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDQ1MDAsImV4cCI6MjA2Mzg4MDUwMH0.aYN_hmbhDVAs1-dk8KZot-Km7Z2WEbVmI-LJNKE-JoU',
  },
  serverExternalPackages: ['@supabase/ssr'],
}

module.exports = nextConfig