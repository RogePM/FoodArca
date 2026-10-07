'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Leaf } from 'lucide-react';
import { useAuthAction } from '@/lib/use-auth-action';

const NAV_LINKS = [
  { name: 'Features', href: '/features' },
  { name: 'Distribution', href: '/' },
  { name: 'Pricing', href: '/pricing' },
];

// Scroll distance (px) at which the home-page nav grows from its small, hero-blended
// form into the full white bar. Two values so it doesn't flicker around one point.
const EXPAND_AT = 64;
const COLLAPSE_AT = 24;

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = usePathname() === '/';

  useEffect(() => {
    if (!isHome) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > COLLAPSE_AT : y > EXPAND_AT));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isHome]);

  // Small and blended into the hero only on the home page, before scrolling.
  // An open mobile menu always gets the full bar so it reads against the page.
  const compact = isHome && !scrolled && !isMobileMenuOpen;

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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
        compact
          ? 'bg-[#FCFAF7] border-transparent shadow-none'
          : 'bg-white border-[#E7E5E4] shadow-sm'
      }`}
    >
      
      {/* --- MAIN HEADER BAR --- */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-[85rem]">
        <div
          className={`flex items-center justify-between transition-[height,padding] duration-300 ease-out ${
            compact ? 'h-[4.25rem] pt-1.5' : 'h-20 pt-0'
          }`}
        >

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
              <span
                className={`font-serif font-medium tracking-tight text-[#1C1917] transition-[font-size] duration-300 ease-out ${
                  compact ? 'text-lg' : 'text-xl'
                }`}
              >
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
              className={`hidden md:block bg-[#D97757] text-white hover:bg-[#c6654a] rounded-full text-sm font-semibold transition-[padding,transform] duration-300 active:scale-[0.98] shadow-sm ${
                compact ? 'px-5 py-2' : 'px-6 py-2.5'
              }`}
            >
              Try for free
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
                Try for free
              </button>
            </div>
          </div>
        </div>
      )}

    </nav>
  );
}