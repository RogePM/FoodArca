import React from 'react';
import FeatureTabs from './FeatureTabs';

export default function FeatureSection() {
  return (
    // Applied the specific background color you requested
    <section className="pt-24 pb-20 sm:py-24 bg-[#F5F5F4] overflow-x-clip">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        
        {/* --- Header Area --- */}
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12 lg:mb-14">
          <h2 className="text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl">
            Scan it, share it, report on it
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed">
            Log food in seconds from any phone, see the same stock on every device, and export reports whenever you need them.
          </p>
        </div>

        {/* --- Interactive Client Island --- */}
        <FeatureTabs />

      </div>
    </section>
  );
}