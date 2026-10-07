// Public site facts used by SEO files (sitemap, robots, structured data, page metadata).
// Set NEXT_PUBLIC_SITE_URL in production if the public address ever differs from this one.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://foodarca.com').replace(/\/$/, '');

export const SITE = {
  name: 'Food Arca',
  // The company that owns and operates Food Arca. The legal pages read this.
  legalName: 'Novo Web Designs LLC',
  email: 'sales@foodarca.com',
  locality: 'Greensboro',
  region: 'NC',
  country: 'US',
};

// The public pages, for the sitemap.
export const PUBLIC_PATHS = ['/', '/features', '/pricing', '/contact', '/privacy', '/terms'];
