'use client';

import React from 'react';
import Image from 'next/image';
import { Check, ArrowRight } from 'lucide-react';
import { useAuthAction } from '@/lib/use-auth-action';

export default function FinalCTASection() {
  const benefits = [
    "30-day free trial",
    "Personalized onboarding",
    "Access to all features"
  ];

  const { handleSignIn } = useAuthAction();

  return (
    <section className="relative py-12 md:py-16 lg:py-24 bg-[#D97757]/[0.08]">
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[85rem]">
        
        {/* --- THE ORIGINAL INSET WHITE CARD --- */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3.5rem] shadow-xl shadow-black/[0.03] border border-[#E7E5E4] overflow-hidden relative">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 p-5 sm:p-8 md:p-12 lg:p-16">
            
            {/* --- Left Content: Exactly as originally designed, but with increased line spacing for balanced height --- */}
            <div className="w-full lg:w-[50%] flex flex-col items-start text-left z-10 flex-shrink-0">
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-[#1C1917] leading-[1.15] lg:leading-[1.1] tracking-tight mb-8 sm:mb-10">
                Get started in <br className="hidden sm:block" /> 
                <span className="text-[#D97757] italic">5 minutes</span>
              </h2>

              {/* Increased line spacing (space-y-6 sm:space-y-7) so the items breathe comfortably without needing extra words or paragraphs */}
              <ul className="space-y-6 sm:space-y-7 mb-12 w-full">
                {benefits.map((benefit, index) => (
                  <li 
                    key={index} 
                    className="flex items-center gap-4 text-base sm:text-lg md:text-xl text-[#57534E] font-medium"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D97757]/10 flex items-center justify-center text-[#D97757]">
                      <Check size={16} strokeWidth={3} />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={handleSignIn}
                  className="group relative w-full sm:w-auto min-h-[44px] px-8 py-3.5 rounded-full bg-[#D97757] text-white font-inter font-semibold text-[15px] transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 overflow-hidden"
                >
                  <span className="relative z-10">Get started</span>
                  <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
                </button>
                
                <a 
                  href="#how-it-works" 
                  className="w-full sm:w-auto min-h-[44px] px-8 py-3.5 rounded-full bg-white border-2 border-[#E7E5E4] hover:border-[#D6D3D1] hover:bg-[#F5F5F4] text-[#1C1917] font-inter font-semibold text-[15px] transition-all duration-300 flex items-center justify-center shadow-sm"
                >
                  Learn more
                </a>
              </div>
            </div>

            {/* --- Right Mockup Area --- */}
            <div className="w-full lg:w-[50%] relative flex items-end justify-center lg:justify-end h-full mt-8 lg:mt-0 lg:pr-12 -mb-8 sm:-mb-12 lg:-mb-0">
              
              <div className="relative w-full max-w-[500px] aspect-[1.25/1] mx-auto lg:mr-0 translate-y-4 sm:translate-y-6">
                <Image
                  src="/mock/FullMock.png"
                  alt="Food Arca Mobile and Tablet Mockup"
                  fill
                  className="object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={85} 
                />
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}