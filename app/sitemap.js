import { PUBLIC_PATHS, SITE_URL } from '@/lib/site';

const LEGAL_PATHS = ['/terms', '/privacy'];

export default function sitemap() {
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: LEGAL_PATHS.includes(path) ? 'yearly' : 'monthly',
    priority: path === '/' ? 1 : LEGAL_PATHS.includes(path) ? 0.3 : 0.8,
  }));
}
