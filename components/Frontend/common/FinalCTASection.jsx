'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuthAction } from '@/lib/use-auth-action';

// The close of the page, as its own full-width band, the same warm grey as the "Get food out faster" section,
// and it sits directly on the dark footer, so the page ends in one piece. The hero's line again, one
// reassurance, one main button.
export default function FinalCTASection() {
  const { handleSignIn } = useAuthAction();

  return (
    <section className="bg-[#F5F5F4] py-24 sm:py-28 lg:py-36">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div>
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="stagger-animate opacity-0 text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl"
              style={{ willChange: 'transform, opacity, filter' }}
            >
              Feed more people, with less waste
            </h2>
            <p
              className="stagger-animate opacity-0 mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed"
              style={{ animationDelay: '0.15s', willChange: 'transform, opacity, filter' }}
            >
              Try it free for up to 150 items. No hardware to buy and nothing to learn first.
            </p>
            <div
              className="stagger-animate opacity-0 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: '0.3s', willChange: 'transform, opacity, filter' }}
            >
              <button
                type="button"
                onClick={handleSignIn}
                className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-3.5 font-inter text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)] sm:w-auto"
              >
                Try for free
                <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <a
                href="/contact"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-[#E7E5E4] bg-white px-8 py-3.5 font-inter text-[15px] font-semibold text-[#1C1917] transition-colors duration-300 hover:border-[#D6D3D1] hover:bg-[#FAFAF9] sm:w-auto"
              >
                Contact us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
