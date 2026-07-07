'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function BenefitsSection() {
  const [activeTab, setActiveTab] = useState('speed');

  const benefits = {
    speed: {
      id: 'speed',
      label: "Instant Onboarding",
      title: "Turn any smartphone into an enterprise barcode scanner.",
      description: "An intuitive interface that lets first-time volunteers scan donations in seconds without training manuals or spreadsheets.",
      highlights: [
        "Zero training required for volunteers of all tech levels",
        "3-second barcode matching with bilingual fuzzy search fallback",
        "Continuous 'Add Another' loop keeps multi-item deliveries unbroken"
      ],
      image: "/mock/scann.png"
    },
    waste: {
      id: 'waste',
      label: "Zero Food Waste",
      title: "Never let good food expire in warehouse corners.",
      description: "Automatically direct volunteers to distribute earliest-expiring batches first while tracking honest month-level precision.",
      highlights: [
        "Automated First-Expiring, First-Out (FEFO) batch queue",
        "Honest precision display without fabricated or guessed dates",
        "Real-time expiration alerts for items needing immediate distribution"
      ],
      image: "/mock/expiration1.png"
    },
    compliance: {
      id: 'compliance',
      label: "Grant Compliance",
      title: "Generate publication-ready reports in two clicks.",
      description: "Filter by date range and generate publication-ready CSV or PDF compliance reports for funders in just two clicks.",
      highlights: [
        "One-click CSV and publication-ready PDF compliance exports",
        "Program-specific filtering tailored for grant requirements",
        "Immutable activity ledger tracking every intake and distribution"
      ],
      image: "/mock/grants.png"
    }
  };

  const currentBenefit = benefits[activeTab];

  return (
    <section className="relative py-16 sm:py-24 lg:py-32 bg-[#1C1917] text-white border-y border-white/10 overflow-hidden">
      
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D97757]/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[85rem] relative z-10">

        {/* --- Section Header --- */}
        <div className="max-w-3xl mb-12 lg:mb-16 text-left">
          <span className="text-[#D97757] font-mono font-semibold text-sm tracking-widest uppercase mb-4 block">
            Why Food Arca
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-[1.15] lg:leading-[1.1] tracking-tight">
            The inventory system food banks <span className="italic text-[#D97757]">deserve.</span>
          </h2>
        </div>

        {/* --- MINIMALIST EDITORIAL TABS --- */}
        <div className="flex overflow-x-auto no-scrollbar justify-start border-b border-white/15 mb-10 sm:mb-12 gap-6 sm:gap-12 w-full">
          {Object.values(benefits).map((benefit) => (
            <button
              key={benefit.id}
              onClick={() => setActiveTab(benefit.id)}
              className={`group relative min-h-[44px] shrink-0 pb-4 text-lg sm:text-xl font-medium transition-colors whitespace-nowrap outline-none flex items-center gap-2 cursor-pointer ${
                activeTab === benefit.id 
                  ? 'text-white font-bold' 
                  : 'text-white/50 hover:text-white/80 font-normal'
              }`}
            >
              <span>{benefit.label}</span>
              
              {/* Hover Underline */}
              {activeTab !== benefit.id && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-white/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              )}

              {/* Active Border Indicator */}
              {activeTab === benefit.id && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[4px] bg-[#D97757] animate-in fade-in zoom-in-95 duration-300 rounded-t-full shadow-[0_0_12px_#D97757]" />
              )}
            </button>
          ))}
        </div>

        {/* --- BALANCED 12-COLUMN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* LEFT COLUMN: Copy & Highlights (Span 6) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            
            <div className="min-h-[220px] flex flex-col justify-start w-full">
              
              {/* REMOVED font-bold from title for clean, editorial serif look */}
              <h3 key={`title-${activeTab}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-2xl sm:text-3xl lg:text-4xl font-serif text-white mb-4 tracking-tight">
                {currentBenefit.title}
              </h3>
              
              {/* CONDENSED to a single sentence to remove reading noise */}
              <p key={`desc-${activeTab}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-lg sm:text-xl text-white/80 font-inter font-light leading-relaxed mb-8">
                {currentBenefit.description}
              </p>

              {/* Highlights List */}
              <div key={`highlights-${activeTab}`} className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3.5 pt-6 border-t border-white/15 w-full">
                {currentBenefit.highlights.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 text-base sm:text-lg text-white/90 font-light">
                    <CheckCircle2 size={20} className="text-[#D97757] shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Link */}
            <div className="mt-10">
              <a 
                href="/signup" 
                className="group inline-flex min-h-[44px] items-center gap-2.5 px-8 py-4 rounded-full bg-[#D97757] text-white font-inter font-semibold text-base transition-all duration-300 hover:shadow-[0_0_25px_rgba(217,119,87,0.6)] hover:-translate-y-0.5"
              >
                <span>Experience these benefits</span>
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
            
          </div>

          {/* RIGHT COLUMN: Large, Balanced Image Frame (Span 6) */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl bg-[#FAFAF9] flex items-center justify-center">
              
              {/* Image Transition Container */}
              {Object.values(benefits).map((benefit) => {
                const isTabActive = activeTab === benefit.id;
                return (
                  <div 
                    key={benefit.id}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      isTabActive 
                        ? 'opacity-100 scale-100 z-10 pointer-events-auto' 
                        : 'opacity-0 scale-95 z-0 pointer-events-none'
                    }`}
                  >
                    <Image
                      src={benefit.image}
                      alt={benefit.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain object-center p-6 sm:p-10"
                      priority={benefit.id === 'speed'}
                    />
                  </div>
                );
              })}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
