import React from 'react';

// Components

import Hero from '../../components/Frontend/Hero/Hero';
import IntroSection from '../../components/Frontend/Intro/IntroSection';
import FeatureSection from '../../components/Frontend/Feature/FeatureSection';
import CTASection from '../../components/Frontend/Solution/CTASection';
import FAQSection from '../../components/Frontend/common/Faq';
import FinalCTASection from '../../components/Frontend/common/FinalCTASection';

import GlobalScrollObserver from '../../components/Frontend/common/GlobalScrollObserver';


const DESCRIPTION = 'Food Arca replaces paper and spreadsheets with one live inventory for food banks and pantries. Scan items in, see the same stock on every device, and export reports.';

export const metadata = {
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: 'Food Arca | Food Bank Inventory Management', description: DESCRIPTION, url: '/' },
  twitter: { title: 'Food Arca | Food Bank Inventory Management', description: DESCRIPTION },
};

export default function LandingPage({ searchParams }) {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] selection:bg-[#D97757] selection:text-white overflow-x-clip">
      
      {/* STRICT SERVER COMPONENTS: Zero JavaScript added to the initial load */}
    
      
      <main>
        <Hero searchParams={searchParams} />
        <IntroSection />
        <FeatureSection />
        <CTASection />
        <FAQSection />
        <FinalCTASection />
      </main>

     

      {/* Logic-only Client Components */}
   
      <GlobalScrollObserver />
    </div>
  );
}