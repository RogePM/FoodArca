import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react'; 
import HeroContainer from './HeroContainer';
import HeroActions from './HeroActions';

export default function Hero() {
return (
    <HeroContainer>
      
      {/* --- Angled Background Graphics --- */}
      <div className="absolute top-[70%] -left-[10%] w-[120%] h-[300px] bg-brand-primary/10 -skew-y-6 -z-10 transform origin-top-left" />
      <div className="absolute top-[85%] -left-[10%] w-[120%] h-[200px] bg-brand-primary/5 -skew-y-6 -z-10 transform origin-top-left" />

      <div className="container mx-auto max-w-7xl flex flex-col items-center text-center relative z-10">
        
        {/* --- Top Badge --- */}
        <div className="hero-reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hero-border bg-white text-sm font-medium mb-8 shadow-sm hover:bg-hero-hover transition-colors cursor-pointer">
          <span className="text-brand-primary font-semibold bg-brand-light px-2 py-0.5 rounded-full text-xs">
            New feature
          </span>
          <span className="text-hero-muted flex items-center gap-1">
            Check out the team dashboard <ArrowRight size={14} />
          </span>
        </div>

        {/* --- Headlines --- */}
        <div className="max-w-4xl mx-auto mb-6 overflow-hidden">
          <h1 className="hero-reveal text-5xl md:text-6xl lg:text-7xl font-serif leading-tight tracking-tight text-hero-main">
            Real-Time Tracking for <br className="hidden md:block" />
            <span className="italic text-brand-primary">Food Banks.</span>
          </h1>
        </div>

        {/* --- Subheadline --- */}
        <div className="max-w-2xl mx-auto mb-10 overflow-hidden">
          <p className="hero-reveal text-lg md:text-xl text-hero-muted font-light tracking-wide">
            The inventory tool for high-volume food pantries. Scan barcodes, sync teams in real-time, and speed up your distribution lines.
          </p>
        </div>

        {/* --- CLIENT ISLAND: CTA Buttons --- */}
        <HeroActions />

        {/* --- Hero Image / Video Container --- */}
        <div className="hero-widget w-full max-w-5xl mx-auto relative group md:mt-8">
          <div className="absolute -inset-1 bg-brand-primary/20 blur-lg rounded-[2.5rem] group-hover:bg-brand-primary/30 transition duration-500 -z-10"></div>
          
          <div className="relative w-full aspect-video min-h-[300px] md:min-h-[500px] bg-white/50 rounded-[2rem] overflow-hidden shadow-2xl shadow-hero-muted/20 border-4 border-white">
            <Image
              src="/person1.png" 
              alt="Food Arca Dashboard"
              fill
              className="hero-img-inner object-cover md:object-bottom scale-[1.15]" 
              priority
            />
          </div>
        </div>

      </div>
    </HeroContainer>
  );
}