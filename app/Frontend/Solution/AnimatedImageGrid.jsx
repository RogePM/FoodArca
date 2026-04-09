import React from 'react';
import Image from 'next/image';

// Removed 'use client' - This is now a 100% Server Component!
export default function AnimatedImageGrid() {
  
  // Data for the 3-image layout
  const photoBricks = [
    { src: '/people/people1.jpg', alt: 'Volunteer 1', className: 'photo-brick_hs_tl', delay: 0 },
    { src: '/people/people2.jpg', alt: 'Volunteer 2', className: 'photo-brick_hs_bl', delay: 300 },
    { src: '/person1.png', alt: 'Volunteer 3', className: 'photo-brick_hs_r', delay: 150 },
  ];

  return (
    // The parent container explicitly holds the space (aspect-square) preventing any layout shifts (CLS)
    <div className="relative w-full aspect-square max-w-[500px] mx-auto lg:mx-0 overflow-visible z-10">
      
      {/* --- SVG Sparkle 1: Small Accent --- */}
      {/* Renders instantly on the server, animation runs on the GPU */}
      <div 
        className="absolute top-[28%] left-[8%] w-6 h-6 text-[#D97757]"
        style={{ animation: 'pulse-sparkle 3s ease-in-out infinite 0.5s' }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C12 0 12 10 22 12C12 14 12 24 12 24C12 24 12 14 2 12C12 10 12 0 12 0Z" />
        </svg>
      </div>

      {/* --- SVG Sparkle 2: Large Accent (Yellow) --- */}
      <div 
        className="absolute top-[40%] left-[10%] w-10 h-10 text-[#EAB308]"
        style={{ animation: 'pulse-sparkle 4s ease-in-out infinite' }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C12 0 12 10 22 12C12 14 12 24 12 24C12 24 12 14 2 12C12 10 12 0 12 0Z" />
        </svg>
      </div>

      {/* --- The 3 Images --- */}
      {photoBricks.map((brick, index) => (
        <div 
          key={index}
          className={`photo-brick ${brick.className}`}
          style={{ 
            animation: `gentle-float 5s ease-in-out infinite ${brick.delay / 500}s` 
          }}
        >
          <Image
            src={brick.src}
            alt={brick.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 40vw, 20vw"
            // If this CTA is lower down on your page, lazy loading is perfect.
            // If this is at the VERY top of your page, change this to priority={true}
            loading="lazy" 
          />
        </div>
      ))}

      {/* GPU-Accelerated Animations (Costs 0 Performance) */}
      <style>{`
        @keyframes gentle-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse-sparkle {
          0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
          50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}