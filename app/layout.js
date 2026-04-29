// app/layout.jsx
import './globals.css';
import ScrollToTop from '@/components/Frontend/common/ScrollToTop'; 
import { GoogleAnalytics } from '@next/third-parties/google'; 

export const metadata = {
  title: 'Food Arca | Food Bank Inventory Management',
  description: 'Food Bank inventory management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#FAFAF9] text-[#1C1917]">
        
        {/* NAKED CHILDREN: 
          Next.js automatically injects either your (marketing) layout 
          or your dashboard layout right here depending on the URL.
        */}
        {children}

        {/* Global UI that is safe to show on EVERY page */}
        <ScrollToTop /> 
      </body>
      
      <GoogleAnalytics gaId="G-YJKJHYLC2C" />
    </html>
  );
}