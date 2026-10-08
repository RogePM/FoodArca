import './globals.css';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { SITE_URL } from '@/lib/site';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Food Arca | Food Bank Inventory Management',
  description: 'Food Bank inventory management system',
  // Defaults for link previews; pages override title, description and url.
  openGraph: { siteName: 'Food Arca', type: 'website', locale: 'en_US' },
  twitter: { card: 'summary' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        
        {/* 2. Google Analytics Script */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-YJKJHYLC2C"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YJKJHYLC2C');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}