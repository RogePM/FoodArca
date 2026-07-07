import React from 'react';
import Image from 'next/image';

export default function CommitmentsMarquee() {
  const commitments = [
    { src: '/icons/Un1.png', alt: 'UN SDGs General', label: 'UN SDGs' },
    { src: '/icons/2.png', alt: 'UN Zero Hunger', label: 'Zero Hunger' },
    { src: '/icons/3.png', alt: 'UN Responsible Consumption', label: 'Responsible Consumption' },
    { src: '/icons/4.png', alt: '1% for the Planet', label: '1% for the Planet' },
  ];

  return (
    <section className="py-10 md:py-12 flex flex-col items-center border-t border-[#E7E5E4] bg-white">
      
      <h2 className="text-lg md:text-xl text-[#57534E] font-serif mb-6 text-center px-4">
        Purpose-Driven Technology.
      </h2>
      
      <div className="w-full overflow-hidden relative flex items-center">
        
        <div
          className="flex whitespace-nowrap"
          style={{ animation: 'marquee 25s linear infinite' }}
        >
          {/* --- PRIMARY LIST --- */}
          {commitments.map((item, index) => (
            <div key={`primary-${index}`} className="flex items-center gap-4 mx-8 md:mx-14 flex-shrink-0">
              
              {/* Sized to exactly 12 on mobile, and 14 on desktop */}
              <div className="relative h-12 w-12 md:h-14 md:w-14 flex-shrink-0">
                <Image 
                  src={item.src} 
                  alt={item.alt} 
                  fill
                  sizes="(max-width: 768px) 48px, 56px"
                  className="object-contain" 
                />
              </div>
              
              <span className="text-base md:text-lg font-medium text-[#57534E]/80 tracking-tight">
                {item.label}
              </span>
            </div>
          ))}
          
          {/* --- SECONDARY LIST (DUPLICATE) --- */}
          {commitments.map((item, index) => (
            <div key={`secondary-${index}`} className="flex items-center gap-4 mx-8 md:mx-14 flex-shrink-0">
              
              {/* Perfectly matches the Primary List so the loop is seamless */}
              <div className="relative h-12 w-12 md:h-14 md:w-14 flex-shrink-0">
                <Image 
                  src={item.src} 
                  alt={item.alt} 
                  fill
                  sizes="(max-width: 768px) 48px, 56px"
                  className="object-contain" 
                />
              </div>
              
              <span className="text-base md:text-lg font-medium text-[#57534E]/80 tracking-tight">
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