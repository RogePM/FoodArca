'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuthAction } from '@/lib/use-auth-action';

export default function HeroActions() {
  const { handleSignIn } = useAuthAction();

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleSignIn}
        className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-3.5 font-inter text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)] sm:w-auto"
      >
        Try for free
        <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
      </button>
      <a
        href="#setup"
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-[#E7E5E4] bg-white px-8 py-3.5 font-inter text-[15px] font-semibold text-[#1C1917] transition-colors duration-300 hover:border-[#D6D3D1] hover:bg-[#FAFAF9] sm:w-auto"
      >
        See the steps
      </a>
    </div>
  );
}
