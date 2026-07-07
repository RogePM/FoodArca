'use client';

import { useState } from 'react';
import { Menu, X, Leaf } from 'lucide-react';
import { useAuthAction } from '@/lib/use-auth-action';

const NAV_LINKS = [
  { name: 'Features', href: '/features' },
  { name: 'Distribution', href: '/' },
  { name: 'Clients', href: '/' },
  { name: 'Pricing', href: '/' },
];

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { handleSignIn } = useAuthAction();

  // Prevent reload and smooth scroll to top if already on the homepage
  const handleLogoClick = (e) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E7E5E4] shadow-sm">
      
      {/* --- MAIN HEADER BAR --- */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-[85rem]">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <div className="flex-1 flex justify-start">
            <a 
              href="/" 
              onClick={handleLogoClick}
              className="flex items-center gap-2 group cursor-pointer"
            >
              {/* Added a subtle rotation on hover to make it feel premium and interactive */}
              <Leaf 
                className="w-5 h-7 text-[#D97757] transition-transform duration-300 group-hover:-rotate-12" 
                strokeWidth={2.5} 
              />
              <span className="text-xl font-serif font-medium tracking-tight text-[#1C1917]">
                Food Arca
              </span>
            </a>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8 shrink-0">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[#57534E] hover:text-[#D97757] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA / Hamburger */}
          <div className="flex-1 flex justify-end items-center gap-3">
            <button 
              onClick={handleSignIn}
              className="hidden md:block bg-[#D97757] text-white hover:bg-[#c6654a] px-6 py-2.5 rounded-full text-sm font-semibold transition-transform active:scale-[0.98] shadow-sm"
            >
              Get started for free
            </button>
            
            <button
              className="lg:hidden text-[#1C1917] p-2 hover:bg-[#F5F5F4] rounded-full transition-colors active:scale-95"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>

        </div>
      </div>

      {/* --- MOBILE MENU (BULLETPROOF) --- */}
      {isMobileMenuOpen && (
        // Added Tailwind animation: animate-in fade-in slide-in-from-top-2
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-[#E7E5E4] shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col px-6 py-8 space-y-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg text-[#1C1917] font-medium py-3 px-4 rounded-xl hover:bg-[#F5F5F4] transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 mt-2 border-t border-[#E7E5E4]">
              <button 
                onClick={handleSignIn}
                className="w-full bg-[#D97757] text-white py-4 rounded-full font-bold text-sm shadow-sm active:scale-95 transition-transform"
              >
                Get started for free
              </button>
            </div>
          </div>
        </div>
      )}

    </nav>
  );
}