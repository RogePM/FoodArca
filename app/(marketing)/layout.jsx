// app/(marketing)/layout.jsx
import React from 'react';
import NavBar from '@/components/frontNav/NavBar';
import Footer from '@/components/Frontend/common/Footer'; // Be sure to import the Footer we made earlier!
import JsonLd from '@/components/Frontend/common/JsonLd';
import { SITE, SITE_URL } from '@/lib/site';

// Who we are, for search engines. Only facts that are on the site already: name, address,
// contact email and the Greensboro location from the terms page.
const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE_URL,
  email: SITE.email,
  address: {
    '@type': 'PostalAddress',
    addressLocality: SITE.locality,
    addressRegion: SITE.region,
    addressCountry: SITE.country,
  },
};

export default function MarketingLayout({ children }) {
  return (
    <>
      <JsonLd data={ORGANIZATION} />

      {/* The NavBar sits at the very top of all public pages */}
      <NavBar />

      {/* The <main> tag wraps the specific page content (Home, Inventory, etc.) */}
      <main className="flex-1">
        {children}
      </main>

      {/* The Footer caps off the bottom of all public pages */}
      <Footer />
    </>
  );
}
