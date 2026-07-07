import React from 'react';
import Image from 'next/image';

export default function AnimatedImageGrid() {
  const photoBricks = [
    { 
      src: '/people/people1.jpg', 
      alt: 'Food bank volunteer smiling while organizing distribution boxes', 
      className: 'photo-brick_hs_tl', 
      delay: '0.15s' 
    },
    { 
      src: '/people/people2.jpg', 
      alt: 'Pantry team member using inventory tracking software on mobile', 
      className: 'photo-brick_hs_bl', 
      delay: '0.3s' // Tightened delays so the cascade feels more connected
    },
    { 
      src: '/person1.png', 
      alt: 'Happy food bank staff member ready for distribution day', 
      className: 'photo-brick_hs_r', 
      delay: '0.6s' 
    },
  ];

  return (
    // NO 'use client', NO refs. Pure Server HTML!
    <div className="relative w-full max-w-[600px] aspect-square mx-auto lg:mx-0 overflow-visible z-10">
      
      {/* --- SVG Sparkles --- */}
      <div 
        // Hooked into your Global Observer with 'stagger-animate'
        className="stagger-animate opacity-0 absolute top-[28%] left-[8%] w-6 h-6 text-[#D97757]"
        style={{ animationDelay: '0.5s', willChange: 'transform, opacity, filter' }} 
      >
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C12 0 12 10 22 12C12 14 12 24 12 24C12 24 12 14 2 12C12 10 12 0 12 0Z" />
        </svg>
      </div>

      <div 
        className="stagger-animate opacity-0 absolute top-[40%] left-[10%] w-10 h-10 text-[#EAB308]"
        style={{ animationDelay: '0.65s', willChange: 'transform, opacity, filter' }} 
      >
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C12 0 12 10 22 12C12 14 12 24 12 24C12 24 12 14 2 12C12 10 12 0 12 0Z" />
        </svg>
      </div>

      {/* --- The 3 Images --- */}
      {photoBricks.map((brick, index) => (
        <div 
          key={index}
          // Hooked into your Global Observer with 'stagger-animate'
          className={`photo-brick ${brick.className} stagger-animate opacity-0`}
          style={{ 
            animationDelay: brick.delay,
            willChange: 'transform, opacity, filter'
          }}
        >
          <Image
            src={brick.src}
            alt={brick.alt}
            fill
            className="object-cover"
            // FIX: Increased to 50vw so Next.js downloads enough pixels for tall frames!
            sizes="(max-width: 768px) 80vw, 50vw"
            // FIX: Forced 100% quality to prevent any aggressive artifacting
            quality={100} 
            loading="lazy" 
          />
        </div>
      ))}

    </div>
  );
}