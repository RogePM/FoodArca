import { SITE_URL } from '@/lib/site';

// Public marketing pages are open. The signed-in app, API and account flows are not for search.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api/', '/onboarding', '/auth/', '/reset-password'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
