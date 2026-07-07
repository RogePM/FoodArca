'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when user scrolls down 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // The `{ passive: true }` flag is CRUCIAL for Web Vitals!
    // It prevents the listener from blocking the browser's native scroll performance.
    window.addEventListener('scroll', toggleVisibility, { passive: true });

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      // pointer-events-none when hidden ensures users don't accidentally click an invisible button
      className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[90] p-3.5 rounded-full bg-[#D97757] text-white transition-all duration-300 ease-out flex items-center justify-center hover:bg-[#c6654a] hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)] hover:-translate-y-1 active:scale-95 ${
        isVisible 
          ? 'opacity-100 translate-y-0 pointer-events-auto shadow-lg' 
          : 'opacity-0 translate-y-4 pointer-events-none shadow-none'
      }`}
    >
      <ArrowUp size={22} strokeWidth={2.5} />
    </button>
  );
}