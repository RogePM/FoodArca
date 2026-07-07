'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

// GROUP 1: Core Inventory & Speed
const featuresGroupOne = [
  {
    id: "01",
    title: "Barcode Scanning",
    tagline: "3-second intake. Even faster distribution.",
    description: "Transform any smartphone or tablet into an enterprise-grade scanner. Process incoming donations and outgoing boxes instantly without typing a single word.",
    imageSrc: "/mock/feat2.png", 
    link: "/features/barcode-scanning"
  },
  {
    id: "02",
    title: "Smart Caching",
    tagline: "Scan once. Autofill forever.",
    description: "Our system remembers every item you scan. The next time a volunteer scans that same barcode, the name, category, and weight autofill instantly.",
    imageSrc: "/mock/feat2.png",
    link: "/features/smart-caching"
  },
  {
    id: "03",
    title: "Works Everywhere",
    tagline: "No downloads. Any device. Instant access.",
    description: "Food Arca runs beautifully in any web browser. Whether your volunteers are using a 5-year-old Android phone or a brand new iPad, it just works.",
    imageSrc: "/mock/feat2.png",
    link: "/features/cross-platform"
  },
  {
    id: "04",
    title: "Expiration Alerts",
    tagline: "Stop wasting food.",
    description: "Never let good food go bad. Set expiration dates during intake and Food Arca will automatically flag items that need to be distributed this week.",
    imageSrc: "/mock/feat2.png",
    link: "/features/expiration-tracking"
  }
];

export default function FeatureLedgerPartOne() {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef([]);

  // This purely tracks which card is currently "active" to update the progress bar on the left
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const cards = cardRefs.current;
          let current = 0;
          const threshold = window.innerHeight * 0.5; // Trigger halfway down screen
          
          cards.forEach((card, index) => {
            if (card) {
              const rect = card.getBoundingClientRect();
              if (rect.top < threshold) {
                current = index;
              }
            }
          });
          
          setActiveIndex(current);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="py-24 md:py-32 bg-[#F5F5F4] relative">
      <div className="container mx-auto px-6 max-w-[85rem]">
        
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 relative items-start">
          
          {/* --- LEFT COLUMN: Sticky Header & Progress Bar --- */}
          <div className="w-full lg:w-[40%] lg:sticky lg:top-40 z-10 flex-shrink-0">
            
            <span className="text-[#D97757] font-medium text-sm tracking-wide mb-6 block uppercase">
              Distribute faster
            </span>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#1C1917] leading-[1.15] lg:leading-[1.1] tracking-tight mb-8">
              A <span className="relative inline-block z-10">seamless
                <svg className="absolute -bottom-2 -left-1 w-[105%] h-5 -z-10 text-[#D97757]/40" viewBox="0 0 120 15" preserveAspectRatio="none">
                  <path d="M2.38 10.37C17.2 9.08 32.06 7.6 46.91 6.38C53.95 5.8 61 5.31 68.04 4.89C76.99 4.36 85.94 3.93 94.89 3.59C96.34 3.53 97.79 3.48 99.24 3.44C100.28 3.41 101.32 3.39 102.36 3.37M11.66 12.01C25.4 10.99 39.15 9.87 52.88 8.87C62.96 8.14 73.04 7.52 83.12 7C91.95 6.55 100.77 6.19 109.6 5.92C110.83 5.88 112.06 5.85 113.29 5.82C114.36 5.8 115.42 5.77 116.49 5.76" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </span> experience for your volunteers.
            </h2>
            
            <p className="text-[17px] sm:text-xl text-[#57534E] font-light max-w-sm leading-relaxed mb-12">
              A web application that speeds up distribution and eliminates manual entry.
            </p>

            {/* PROGRESS BAR */}
            <div className="hidden lg:flex flex-col gap-4 w-full max-w-[280px]">
              <div className="flex items-center justify-between text-sm font-mono font-semibold tracking-widest text-[#A8A29E]">
                <span className="text-[#D97757] transition-all duration-300">0{activeIndex + 1}</span>
                <span>0{featuresGroupOne.length}</span>
              </div>
              <div className="w-full h-[4px] bg-[#E7E5E4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D97757] transition-all duration-500 ease-out"
                  style={{ width: `${((activeIndex + 1) / featuresGroupOne.length) * 100}%` }}
                />
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: The Stacking Cards --- */}
          <div className="w-full lg:w-[60%] relative pb-[10vh]">
            
            {featuresGroupOne.map((feature, index) => {
              return (
                // THE STACKING MAGIC
                // 1. The outer div is sticky.
                // 2. The margin-bottom (mb-[60vh]) creates the physical scrolling distance between cards.
                // 3. The paddingTop creates the layered "deck" offset effect perfectly!
                <div 
                  key={feature.id}
                  ref={(el) => (cardRefs.current[index] = el)}
                  className="sticky top-24 lg:top-32 w-full mb-[50vh] lg:mb-[70vh] last:mb-[10vh]"
                  style={{ paddingTop: `${index * 24}px` }}
                >
                  
                  {/* THE VISUAL CARD */}
                  <div className="w-full bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] border border-[#E7E5E4] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all duration-700 ease-out">
                    <div className="flex flex-col gap-6 sm:gap-8">
                      
                      {/* BULLETPROOF IMAGE CONTAINER */}
                      <div className="w-full bg-[#FAFAF9] rounded-2xl border border-[#E7E5E4] shadow-inner p-2 sm:p-4">
                        <Image
                          src={feature.imageSrc}
                          alt={`Mockup of ${feature.title}`}
                          width={800}
                          height={500}
                          className="w-full h-auto object-contain rounded-lg border border-[#E7E5E4]/50 shadow-sm"
                          quality={85}
                        />
                      </div>

                      {/* Content Area */}
                      <div className="flex flex-col items-start w-full">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-sm font-semibold text-[#A8A29E] tracking-widest font-mono shrink-0">
                            {feature.id}
                          </span>
                          <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#D97757] leading-tight tracking-tight">
                            {feature.title}
                          </h3>
                        </div>
                        
                        <h4 className="text-[17px] font-medium text-[#1C1917] mb-3">
                          {feature.tagline}
                        </h4>
                        
                        <p className="text-[16px] text-[#57534E] font-light leading-relaxed mb-6 max-w-2xl">
                          {feature.description}
                        </p>

                        <a 
                          href={feature.link}
                          className="group inline-flex items-center gap-2 text-[15px] font-semibold text-[#D97757] transition-all duration-300"
                        >
                          Explore feature 
                          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </a>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}

          </div>

        </div>
      </div>
    </section>
  );
}