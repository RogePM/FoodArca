'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function HeroContainer({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Register GSAP Plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // Use gsap.context for easy cleanup in React
    let ctx = gsap.context(() => {
      
      // 1. Staggered Text Reveal
      const heroTextElements = gsap.utils.toArray('.hero-reveal');
      heroTextElements.forEach((el, i) => {
        gsap.fromTo(el,
          { y: 50, opacity: 0, clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' },
          {
            y: 0, opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            duration: 1, delay: 0.2 + (i * 0.15), ease: "power3.out"
          }
        );
      });

      // 2. Widget & Button Fade Up
    

      // 3. Image Parallax (Tied to scroll)
      gsap.to(".hero-img-inner", {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

    }, containerRef);

    return () => ctx.revert(); // Clean up on unmount
  }, []);

  return (
    <section ref={containerRef} className="hero-section relative min-h-screen pt-32 pb-20 px-4 md:px-6 overflow-hidden flex flex-col items-center isolate">
      {/* This 'children' slot is the magic. Next.js will inject your Server HTML right here. */}
      {children}
    </section>
  );
}