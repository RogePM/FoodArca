import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function StepsHeaderCTA() {
  return (
    // CHANGED: Increased gap to md:gap-16 and bottom margin to mb-16 lg:mb-24 for massive breathing room
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 md:gap-16 mb-16 lg:mb-24">
      
      {/* --- Left Side: Text Content --- */}
      <div className="flex-1 max-w-3xl">
        {/* CHANGED: Bumped up the desktop font size slightly (lg:text-[3.25rem]) and increased bottom margin (mb-6) */}
        <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-serif text-hero-main mb-6 leading-[1.15]">
          Transform your distribution in three simple steps.
        </h2>
        
        {/* CHANGED: Added max-w-2xl so the paragraph doesn't stretch too far, keeping it highly readable */}
        <p className="text-xl text-hero-muted font-light leading-relaxed max-w-2xl">
          The intelligent inventory system built to eliminate chaos and speed up tracking.
        </p>
      </div>

      {/* --- Right Side: Action Buttons --- */}
      <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 mt-4 md:mt-0">
        <a 
          href="/how-it-works" 
          className="w-full sm:w-auto px-7 py-4 rounded-xl border-2 border-hero-border bg-white hover:bg-hero-hover text-hero-main font-semibold text-[15px] transition-all flex items-center justify-center text-center shadow-sm"
        >
          See how it works
        </a>
        <a 
          href="/signup" 
          className="w-full sm:w-auto px-7 py-4 rounded-xl bg-brand-primary hover:opacity-90 text-white font-semibold text-[15px] transition-all flex items-center justify-center gap-2 text-center shadow-md active:scale-[0.98]"
        >
          Start for free <ArrowRight size={18} />
        </a>
      </div>

    </div>
  );
}