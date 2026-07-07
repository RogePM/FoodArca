import React from 'react';

// Components

import Hero from '../../components/Frontend/Hero/Hero';
import ClientMarquee from '../../components/Frontend/common/MarquesBar';
import FeatureSection from '../../components/Frontend/Feature/FeatureSection';
import FeatureCards from '../../components/Frontend/Distribution/FeatureCards';
import CTASection from '../../components/Frontend/Solution/CTASection';
import FAQSection from '../../components/Frontend/common/Faq';
import FinalCTASection from '../../components/Frontend/common/FinalCTASection';

import GlobalScrollObserver from '../../components/Frontend/common/GlobalScrollObserver';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] selection:bg-[#D97757] selection:text-white overflow-x-hidden">
      
      {/* STRICT SERVER COMPONENTS: Zero JavaScript added to the initial load */}
    
      
      <main>
        <Hero />
        <ClientMarquee />
        <FeatureSection />
        <FeatureCards />
        <CTASection />
        <FAQSection />
        <FinalCTASection />
      </main>

     

      {/* Logic-only Client Components */}
   
      <GlobalScrollObserver />
    </div>
  );
}