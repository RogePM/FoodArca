// 1. Removed 'use client' - This is now a pure Server Component!
import React from 'react';
// 2. Imported Next.js Image for Web Vitals optimization
import Image from 'next/image';

export default function CommitmentsMarquee() {
  const commitments = [
    { src: '/icons/Un1.png', alt: 'UN SDGs General', label: 'UN SDGs' },
    { src: '/icons/2.png', alt: 'UN Zero Hunger', label: 'Zero Hunger' },
    { src: '/icons/3.png', alt: 'UN Responsible Consumption', label: 'Responsible Consumption' },
    { src: '/icons/4.png', alt: '1% for the Planet', label: '1% for the Planet' },
    { src: '/icons/shield.png', alt: 'Encryption Shield', label: 'Encrypted & Secure' },
  ];

  return (
    <section className="py-20 flex flex-col items-center border-t border-[#E7E5E4] bg-white">
      
    {/* Updated Section Title */}
      <h2 className="text-xl md:text-2xl text-[#57534E] font-serif mb-12 text-center px-4">
        Purpose-Driven Technology.
      </h2>
      
      <div className="w-full overflow-hidden relative flex items-center">
        
        <div
          className="flex whitespace-nowrap"
          style={{ animation: 'marquee 25s linear infinite' }}
        >
          {/* Primary List */}
          {commitments.map((item, index) => (
            <div key={`primary-${index}`} className="flex items-center gap-3 mx-10 md:mx-16 flex-shrink-0">
              {/* 3. Replaced <img> with <Image /> to prevent Layout Shifts (CLS) */}
              <div className="relative h-12 w-12 flex-shrink-0">
                <Image 
                  src={item.src} 
                  alt={item.alt} 
                  fill
                  sizes="48px"
                  className="object-contain" 
                />
              </div>
              <span className="text-lg font-medium text-[#1C1917] tracking-tight">
                {item.label}
              </span>
            </div>
          ))}
          
          {/* Secondary List (Duplicate) */}
          {commitments.map((item, index) => (
            <div key={`secondary-${index}`} className="flex items-center gap-3 mx-10 md:mx-16 flex-shrink-0">
              <div className="relative h-12 w-12 flex-shrink-0">
                <Image 
                  src={item.src} 
                  alt={item.alt} 
                  fill
                  sizes="48px"
                  className="object-contain" 
                />
              </div>
              <span className="text-lg font-medium text-[#1C1917] tracking-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute top-0 left-0 h-full w-24 md:w-48 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 h-full w-24 md:w-48 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}