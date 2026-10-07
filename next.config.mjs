/** @type {import('next').NextConfig} */
const nextConfig = {
  // The hero is the sign-in screen now; keep old /login links working.
  async redirects() {
    return [
      { source: '/login', destination: '/', permanent: true },
      // The old Features page became How it works.
      { source: '/features', destination: '/how-it-works', permanent: true },
    ];
  },
  images: {
    qualities: [75, 85, 100],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
