import React from 'react';
import Image from 'next/image';
import StepsHeaderCTA from './StepsHeaderCTA';

export default function FeatureCards() {
  const cards = [
    {
      id: 1,
      title: 'Phone scanning barcode',
      description: 'Quickly scan items directly from your mobile device to build carts instantly without manual entry.',
      bgColor: 'bg-[#1E293B]', // Slate
      image: '/mock/scann.png',
      imageWrapperClass: 'top-0 w-[115%] sm:w-[100%] md:w-[140%] lg:w-[125%]',
      imageClass: 'object-cover object-top',
    },
    {
      id: 2,
      title: 'Dashboard updating',
      description: 'Watch your inventory sync in real-time across all devices on the floor to keep your team aligned.',
      bgColor: 'bg-[#D97757]', // Brand Terracotta
      image: '/mock/tablet.png',
      imageWrapperClass: 'top-4 w-[95%] sm:w-[85%] md:w-[110%] lg:w-[100%]',
      imageClass: 'object-contain object-top', 
    },
    {
      id: 3,
      title: 'Cart checkout',
      description: 'Process distributions effortlessly with anonymous grab-and-go or fully tracked client checkouts.',
      bgColor: 'bg-[#78716C]', // Warm Stone
      image: '/mock/cart.png',
      imageWrapperClass: 'top-0 w-[115%] sm:w-[100%] md:w-[140%] lg:w-[125%]',
      imageClass: 'object-cover object-top',
    },
  ];

  return (
    // NO 'use client', NO refs. Pure Server HTML.
    <section className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 max-w-[85rem]">
        
        {/* Hooked into the Global Observer */}
        <div 
          className="stagger-animate opacity-0" 
          style={{ animationDelay: '0s', willChange: 'transform, opacity, filter' }}
        >
          <StepsHeaderCTA />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {cards.map((card, index) => (
            <div 
              key={card.id} 
              // Added stagger-animate and opacity-0 as static classes
              className={`relative overflow-hidden rounded-[2.5rem] text-white ${card.bgColor} h-[420px] lg:h-[520px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] flex flex-col transition-transform hover:-translate-y-2 duration-500 stagger-animate opacity-0`}
              style={{ 
                animationDelay: `${(index + 1) * 0.2}s`,
                willChange: 'transform, opacity, filter' // Added GPU optimization
              }}
            >
              
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/20 to-transparent z-0 pointer-events-none"></div>
              
              <div className="relative z-10 h-[45%] flex flex-col justify-center items-center text-center px-6 lg:px-10">
                <h3 className="text-2xl lg:text-[1.85rem] font-inriaSerif font-bold mb-3 tracking-tight leading-tight">
                  {card.title}
                </h3>
                <p className="text-white/90 text-sm lg:text-base font-inter leading-relaxed font-medium max-w-[90%]">
                  {card.description}
                </p>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-[60%]">
                <div className={`absolute left-1/2 -translate-x-1/2 h-full ${card.imageWrapperClass}`}>
                  <Image 
                    src={card.image} 
                    alt={card.title}
                    fill
                    className={`drop-shadow-2xl ${card.imageClass}`} 
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </div>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
}