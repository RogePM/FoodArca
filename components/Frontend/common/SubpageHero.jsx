'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function SubpageHero({ 
  titleBase, 
  titleHighlight, 
  subtitle, 
  primaryBtnText = "Get started", 
  primaryBtnHref = "/signup",
  secondaryBtnText = "Learn more",
  secondaryBtnHref = "#features",
  mainImageSrc = "/mock/dash.png"
}) {
  return (
    // Extra top padding (pt-28 to pt-48) to make Hero commanding and balanced with second section
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 lg:pt-48 lg:pb-32 bg-[#FAFAF9] overflow-hidden">
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[85rem]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          
          {/* --- LEFT COLUMN: Text & Buttons --- */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left z-10">
            
            <h1 
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#1C1917] leading-[1.1] tracking-tight mb-6"
            >
              {titleBase} <br className="hidden sm:block" />
              <span className="italic text-[#D97757]">{titleHighlight}</span>
            </h1>

            <p 
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both text-lg md:text-xl text-[#57534E] font-light tracking-wide max-w-lg mb-10"
            >
              {subtitle}
            </p>

            <div 
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              {/* Primary Button */}
              <a 
                href={primaryBtnHref} 
                className="group relative w-full sm:w-auto min-h-[44px] px-8 py-3.5 rounded-full bg-[#D97757] text-white font-inter font-semibold text-[15px] transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 overflow-hidden"
              >
                <span className="relative z-10">{primaryBtnText}</span>
                <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
              </a>
              
              {/* Secondary Button */}
              <a 
                href={secondaryBtnHref} 
                className="w-full sm:w-auto min-h-[44px] px-8 py-3.5 rounded-full bg-white border-2 border-[#E7E5E4] hover:border-[#D6D3D1] hover:bg-[#F5F5F4] text-[#1C1917] font-inter font-semibold text-[15px] transition-all duration-300 flex items-center justify-center shadow-sm"
              >
                {secondaryBtnText}
              </a>
            </div>

          </div>

          {/* --- RIGHT COLUMN: Single Main Image --- */}
          <div 
            className="animate-in fade-in zoom-in-95 duration-1000 delay-200 fill-mode-both w-full lg:w-1/2 relative mt-8 lg:mt-0"
          >
            {/* The colored background box */}
            <div className="absolute top-4 -right-4 bottom-4 left-12 bg-[#1C1917] rounded-[2rem] -z-10 rotate-1 opacity-5"></div>
            
            {/* Main Background Image (Expanded to aspect-[16/11] for a commanding presence) */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/11] rounded-2xl md:rounded-[2.5rem] border border-[#E7E5E4] shadow-2xl overflow-hidden bg-white ml-auto">
              <Image
                src={mainImageSrc}
                alt="Feature presentation"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain sm:object-cover object-left-top"
                priority
              />
            </div>
            
          </div>

        </div>
      </div>
    </section>
  );
}