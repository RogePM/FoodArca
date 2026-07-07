'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuthAction } from '@/lib/use-auth-action';

export default function HeroActions() {
  const { handleSignIn } = useAuthAction();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-6">
      
      {/* PRIMARY BUTTON: "Get started" (Synced with your FinalCTASection) */}
      <button 
        onClick={handleSignIn}
        className="group relative w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#D97757] text-white font-inter font-semibold text-[15px] transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 overflow-hidden"
      >
        <span className="relative z-10">Get started</span>
        <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
      </button>

      {/* SECONDARY BUTTON: "How it works" */}
      <a 
        href="#how-it-works" 
        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border-2 border-[#E7E5E4] hover:border-[#D6D3D1] hover:bg-[#F5F5F4] text-[#1C1917] font-inter font-semibold text-[15px] transition-all duration-300 flex items-center justify-center shadow-sm"
      >
        How it works
      </a>
      
    </div>
  );
}