'use client';

import { useEffect } from 'react';

export default function GlobalScrollObserver() {
  useEffect(() => {
    // 1. Create a single observer for the whole page
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-water-wash');
          entry.target.classList.remove('opacity-0');
          obs.unobserve(entry.target); // Only animate once
        }
      });
    }, { threshold: 0.15 });

    // 2. Find every element on the page with the trigger class
    const elements = document.querySelectorAll('.stagger-animate');
    elements.forEach(el => observer.observe(el));

    // Cleanup
    return () => observer.disconnect();
  }, []);

  // This component renders absolutely nothing to the screen
  return null; 
}