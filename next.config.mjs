/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep a visited page's server data in the browser for 30 s, so switching back to it (Inventory →
  // Add → Inventory) is instant, with no server round trip. Safe with live data: every screen hands
  // over to the shared live store (lib/use-inventory, realtime) right after drawing, and server data
  // that may be older than the latest change is refetched (PantryProvider useServerDataIsCurrent).
  // Switching pantry calls router.refresh(), which clears it.
  experimental: {
    staleTimes: { dynamic: 30 },
  },
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
