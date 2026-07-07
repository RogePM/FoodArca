'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugin outside the component so it only happens once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeroContainer({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    
    let ctx = gsap.context(() => {
      
      // 1. The Main Background (Slower)
      gsap.to(".hero-bg-parallax", {
        yPercent: -20, 
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

      // 2. The Cloud (Moves much faster to create depth!)
      // FIX: Changed yPercent to y: "-50vh". 
      // Because the cloud is small, we force it to move half a screen's distance!
      gsap.to(".hero-cloud-parallax", {
        y: "-80vh", 
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="hero-section relative min-h-[100dvh] pt-32 pb-20 px-4 md:px-6 overflow-hidden flex flex-col items-center isolate"
    >
      {children}
    </section>
  );
}