import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react'; 
import HeroContainer from './HeroContainer';
import HeroActions from './HeroActions';

export default function Hero() {
  return (
    <HeroContainer>
      
      {/* --- SVG BACKGROUNDS WRAPPER (WEB VITALS OPTIMIZED) --- */}
      {/* 1. Added 'hidden md:block'. This completely hides it on mobile. 
          2. Removed all the 'md:' prefixes inside since this entire block only exists on desktop now! */}
      <div className="hidden md:block absolute -bottom-24 left-0 w-full h-[100%] -z-20 pointer-events-none">
        
        {/* THE FAST CLOUD (RIGHT) */}
        <div className="hero-cloud-parallax absolute right-[-2%] bottom-[25%] w-[350px] h-[200px] z-0 opacity-85 will-change-transform">
          <Image
            src="/mock/cloud1.png"
            alt="Decorative Cloud Right"
            fill
            className="object-contain"
            // Ensure priority is OFF so it lazy loads and saves mobile bandwidth
          />
        </div>

        {/* THE FAST CLOUD (LEFT - MIRRORED) */}
        {/* Added -scale-x-100 to flip the image horizontally so it doesn't look identical to the right one */}
        <div className="hero-cloud-parallax absolute left-[-1%] bottom-[30%] w-[350px] h-[200px] z-0 opacity-85 will-change-transform -scale-x-100">
          <Image
            src="/mock/cloud1.png"
            alt="Decorative Cloud Left"
            fill
            className="object-contain"
          />
        </div>

        {/* THE MAIN BACKGROUND */}
        <div className="hero-bg-parallax absolute inset-0 z-10 will-change-transform">
          <Image 
            src="/mock/Background2.png" 
            alt="Decorative Background" 
            fill 
            className="object-contain object-bottom opacity-90" 
            // REMOVED `priority`! This forces the browser to focus on downloading your Dashboard LCP first.
          />
        </div>

      </div>

      <div className="container mx-auto max-w-7xl flex flex-col items-center text-center relative z-10 pt-10">
        
        {/* --- Top Badge (Refined UI) --- */}
        <div className="animate-hero-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E7E5E4] bg-white text-sm font-medium mb-8 shadow-sm hover:bg-[#F5F5F4] transition-colors cursor-pointer">
          <span className="text-white font-semibold bg-[#D97757] px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
            New
          </span>
          <span className="text-[#57534E] flex items-center gap-1 text-[13px]">
            Check out the team dashboard <ArrowRight size={14} />
          </span>
        </div>

        {/* --- Headlines --- */}
        <div className="max-w-4xl mx-auto mb-6 overflow-hidden">
          <h1 className="animate-hero-2 text-5xl md:text-6xl lg:text-7xl font-serif leading-tight tracking-tight text-[#1C1917]">
            Real-Time Tracking for <br className="hidden md:block" />
            <span className="italic text-[#D97757]">Food Banks.</span>
          </h1>
        </div>

        {/* --- Subheadline --- */}
        <div className="max-w-2xl mx-auto mb-8 overflow-hidden">
          <p className="animate-hero-3 text-lg md:text-xl text-[#57534E] font-light tracking-wide">
            The inventory tool for high-volume food pantries. Scan barcodes, sync teams in real-time, and feed more families.
          </p>
        </div>

        {/* --- Actions --- */}
        <div className="animate-hero-4 w-full">
          <HeroActions />
        </div>

        {/* --- Dashboard Container --- */}
        <div className="w-full max-w-5xl mx-auto relative group -mt-4 md:-mt-10 translate-y-12 md:translate-y-24">
          <div className="relative w-full aspect-video min-h-[300px] md:min-h-[500px] bg-white rounded-t-[2rem] overflow-hidden border-4 border-b-0 border-white/60 shadow-[0_0_60px_-15px_rgba(217,119,87,0.3)]">
            <Image
              src="/mock/dash.png" 
              alt="Food Arca Dashboard"
              fill
              className="object-cover object-top scale-[1.01]" 
              priority // This IS your LCP. Keep priority here!
              quality={85} 
            />
          </div>
        </div>

      </div>

      {/* --- The White Bottom Blur --- */}
      <div className="absolute bottom-0 left-0 w-full h-32 md:h-56 bg-gradient-to-t from-white via-[#FAFAF9]/90 to-transparent z-20 pointer-events-none" />

    </HeroContainer>
  );
}