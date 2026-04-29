'use client';

import React from 'react';
import Image from 'next/image';
import { Check, ArrowRight } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function FinalCTASection() {
  const benefits = [
    "30-day free trial",
    "Personalized onboarding",
    "Access to all features"
  ];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  return (
    // CHANGED: Replaced bg-[#FAFAF9] with bg-[#D97757]/[0.08] to match your pricing section
    <section className="relative py-12 md:py-16 lg:py-24 bg-[#D97757]/[0.08]">
      
      <div className="container mx-auto px-4 sm:px-6 max-w-[85rem]">
        
        {/* --- THE INSET CARD --- */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3.5rem] shadow-xl shadow-black/[0.03] border border-[#E7E5E4] overflow-hidden relative">
          
          {/* FLEX CONTAINER: pt-10 px-6 for mobile, pt-16 px-16 for desktop */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 pt-10 px-6 sm:px-10 pb-0 lg:p-16 lg:pr-0">
            
            {/* --- Left Content: Text & Buttons --- */}
            <div className="w-full lg:w-[48%] flex flex-col items-start text-left z-10 flex-shrink-0 pb-8 lg:pb-0">
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-[#1C1917] leading-[1.15] lg:leading-[1.1] tracking-tight mb-6 sm:mb-8">
                Get started in <br className="hidden sm:block" /> 
                <span className="text-[#D97757] italic">5 minutes</span>
              </h2>

              <ul className="space-y-4 sm:space-y-5 mb-10">
                {benefits.map((benefit, index) => (
                  <li 
                    key={index} 
                    className="flex items-center gap-3.5 sm:gap-4 text-[15px] sm:text-base md:text-lg text-[#57534E] font-medium"
                  >
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#D97757]/10 flex items-center justify-center text-[#D97757]">
                      <Check size={14} className="scale-90 sm:scale-100" strokeWidth={3} />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={handleSignIn}
                  className="group relative w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#D97757] text-white font-inter font-semibold text-[15px] transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 overflow-hidden"
                >
                  <span className="relative z-10">Get started</span>
                  <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
                </button>
                
                <a 
                  href="#how-it-works" 
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border-2 border-[#E7E5E4] hover:border-[#D6D3D1] hover:bg-[#F5F5F4] text-[#1C1917] font-inter font-semibold text-[15px] transition-all duration-300 flex items-center justify-center shadow-sm"
                >
                  Learn more
                </a>
              </div>
            </div>

            {/* --- Right Mockup Area --- */}
            {/* Added relative position here to contain the mobile translate-y effects */}
            <div className="w-full lg:w-[52%] relative flex items-end justify-center lg:justify-end h-full mt-auto">
              
              {/* 1. DESKTOP MOCKUP (Bleeds off the right edge cleanly) */}
              <div className="hidden lg:block relative w-[115%] aspect-[1.3/1] -mr-[10%] xl:-mr-[5%] mt-8 translate-y-8">
                <Image
                  src="/mock/SideMock.png"
                  alt="Food Arca Dashboard Mockup"
                  fill
                  className="object-contain object-right-top drop-shadow-[-10px_10px_30px_rgba(0,0,0,0.08)]"
                  sizes="(min-width: 1024px) 50vw, 1px"
                  quality={85} 
                />
              </div>

              {/* 2. MOBILE MOCKUP */}
              {/* MOBILE UI OPTIMIZATION:
                  - increased width to w-full.
                  - reduced aspect ratio to [1.2/1] so it takes up less vertical space.
                  - reduced translate-y to just enough to sit snugly on the bottom border.
              */}
              <div className="block lg:hidden relative w-full sm:w-[95%] max-w-[500px] aspect-[1.2/1] mx-auto scale-105 mt-2 translate-y-2">
                <Image
                  src="/mock/FullMock.png"
                  alt="Food Arca Mobile and Tablet Mockup"
                  fill
                  className="object-contain object-bottom drop-shadow-[0_15px_40px_rgba(0,0,0,0.1)]"
                  sizes="(max-width: 1024px) 100vw, 1px"
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