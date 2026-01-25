import './globals.css';
import { PantryProvider } from '@/components/providers/PantryProvider';
import Script from 'next/script'; // <--- 1. Import Script

export const metadata = {
  title: 'Food Arca | Food Bank Inventory Management',
  description: 'Food Bank inventory management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        
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

        <PantryProvider>
          {children}
        </PantryProvider>
      </body>
    </html>
  );
}