// app/(marketing)/layout.jsx
import React from 'react';
import NavBar from '@/components/frontNav/NavBar';
import Footer from '@/components/Frontend/common/Footer'; // Be sure to import the Footer we made earlier!

export default function MarketingLayout({ children }) {
  return (
    <>
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