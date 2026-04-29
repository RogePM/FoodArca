import React from 'react';
import FeatureTabs from './FeatureTabs';

export default function FeatureSection() {
  return (
    // Applied the specific background color you requested
    <section className="py-24 bg-[#F5F5F4] overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        
        {/* --- Header Area --- */}
        <div className="max-w-3xl mb-16">
          <span className="text-brand-primary font-medium text-sm tracking-wide mb-4 block">
            Distribute faster
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-hero-main mb-6">
            A <span className="relative inline-block z-10">seamless
              {/* CHANGED: text-brand-primary/40 makes it visible, parent z-10 keeps it in front of the background */}
              <svg className="absolute -bottom-2 -left-1 w-[105%] h-5 -z-10 text-brand-primary/40" viewBox="0 0 120 15" preserveAspectRatio="none">
                <path d="M2.38 10.37C17.2 9.08 32.06 7.6 46.91 6.38C53.95 5.8 61 5.31 68.04 4.89C76.99 4.36 85.94 3.93 94.89 3.59C96.34 3.53 97.79 3.48 99.24 3.44C100.28 3.41 101.32 3.39 102.36 3.37M11.66 12.01C25.4 10.99 39.15 9.87 52.88 8.87C62.96 8.14 73.04 7.52 83.12 7C91.95 6.55 100.77 6.19 109.6 5.92C110.83 5.88 112.06 5.85 113.29 5.82C114.36 5.8 115.42 5.77 116.49 5.76" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </span> experience for your volunteers
          </h2>
          <p className="text-xl text-hero-muted font-light">
            A web application that speeds up distribution and eliminates manual entry.
          </p>
        </div>

        {/* --- Interactive Client Island --- */}
        <FeatureTabs />

      </div>
    </section>
  );
}