'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Leaf } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);
      if (scrolled && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.querySelector(id);
      if (element) {
        const offset = 100;
        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      }
    }
  };

  const containerClasses = isScrolled || isMobileMenuOpen
    ? 'w-full rounded-none px-6 py-4 bg-[#FAFAF9] border-x-0 border-t-0 shadow-sm border-b border-[#E7E5E4]'
    : 'w-[95%] max-w-5xl rounded-3xl px-6 py-3 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-black/5';

  return (
    <nav className={`fixed left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-in-out ${isScrolled || isMobileMenuOpen ? 'top-0 px-0' : 'top-4 md:top-8 px-4'}`}>
      <div className={`flex flex-col border border-[#E7E5E4] transition-all duration-500 ease-in-out overflow-hidden md:overflow-visible ${containerClasses}`}>

        {/* --- TOP ROW --- */}
        <div className="flex items-center justify-between w-full relative gap-4">

          {/* ZONE 1: Left (Logo) */}
          <div className="flex-1 flex justify-start min-w-fit">
            <a href="#" onClick={(e) => scrollToSection(e, 'top')} className="flex items-center gap-2 group cursor-pointer">
              <div className="relative flex items-center justify-center shrink-0">
                <Leaf className="w-6 h-8 text-[#D97757]" strokeWidth={2} />
              </div>
              <span className="text-medium font-serif font-medium tracking-tight text-[#1C1917] whitespace-nowrap">
                Food Arca
              </span>
            </a>
          </div>

          {/* ZONE 2: Center (Nav Links) */}
          {/* Note: Hidden on small screens, Flex on LG (Large) screens */}
          <div className="hidden lg:flex items-center gap-8 px-8 shrink-0">
            {['Inventory', 'Distribution', 'Clients', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(e) => scrollToSection(e, `#${item.toLowerCase()}`)}
                className="text-sm font-medium text-[#57534E] hover:text-[#D97757] transition-colors whitespace-nowrap"
              >
                {item}
              </a>
            ))}
          </div>

          {/* ZONE 3: Right (Button) */}
          <div className="flex-1 flex justify-end items-center gap-3 min-w-fit">
            
            {/* FIX: Changed breakpoint to 'md:block' so it appears on Tablets & Desktop */}
            <button 
              onClick={handleSignIn}
              className="hidden md:block bg-[#1C1917] text-white hover:bg-[#D97757] px-5 py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
            >
              Start Free Pilot
            </button>
            
            {/* Hamburger: Shows on Mobile (< md), Hides on Tablet/Desktop (md:hidden) */}
            <button
              className="md:hidden text-[#1C1917] p-1 hover:bg-black/5 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

        </div>

        {/* --- MOBILE MENU --- */}
        <div className={`lg:hidden flex flex-col transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'max-h-[500px] opacity-100 pt-6 pb-4' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          {['Inventory', 'Distribution', 'Clients', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={(e) => scrollToSection(e, `#${item.toLowerCase()}`)}
              className="text-xl text-[#57534E] font-medium py-4 border-b border-[#E7E5E4]/50 last:border-0 hover:text-[#D97757] transition-colors"
            >
              {item}
            </a>
          ))}
          
          <button 
            onClick={handleSignIn}
            className="w-full mt-8 bg-[#D97757] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-transform"
          >
            Start Free Pilot
          </button>
        </div>

      </div>
    </nav>
  );
}