'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Smartphone, Search, Layers, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function MobileExperienceSection() {
  const [activeTab, setActiveTab] = useState(0);

  const mobileWorkflows = [
    {
      id: 0,
      title: "Intent-First Home Screen",
      tagline: "Instant daily numbers without dashboard clutter.",
      description: "A volunteer opening the app mid-shift needs to act immediately. Two visually dominant buttons for Receive Stock and Distribute Stock sit front and center, with top location switching that displays your pantry's accent color.",
      image: "/mock/scann.png",
      icon: Smartphone,
      highlights: [
        "Two large primary intent buttons: Receive & Distribute",
        "Top location switcher with instant brand color confirmation",
        "Instant load daily numbers without complex aggregation"
      ]
    },
    {
      id: 1,
      title: "Three-Way Item Identification",
      tagline: "Recent shortcuts, fuzzy search, or camera scan.",
      description: "A forced camera permission prompt is a weak pattern. Our flow gives volunteers three equal ways to identify an item on a single screen. When receiving or distributing multiple items, our continuous 'Add Another' loop keeps the session unbroken.",
      image: "/mock/scan1.png",
      icon: Search,
      highlights: [
        "Zero forced camera permission prompts on launch",
        "Continuous 'Add Another' loop for multi-item deliveries",
        "Bilingual fuzzy search fallback when barcodes are missing"
      ]
    },
    {
      id: 2,
      title: "Unified Inventory & Search",
      tagline: "Search and browse combined on a single screen.",
      description: "Keep mobile navigation minimal with one unified screen. Debounced fuzzy search runs live against catalog items, while category chips group items instantly. Each row displays computed on-hand quantities and colored dots for expiring stock.",
      image: "/mock/inventory.png",
      icon: Layers,
      highlights: [
        "Combined search bar and category chip browsing",
        "Computed on-hand total displayed directly on each row",
        "Live fuzzy query prevents catalog duplicates during item creation"
      ]
    },
    {
      id: 3,
      title: "Honest FEFO Item Detail",
      tagline: "Literal First-Expiring, First-Out batch queue.",
      description: "See why the app recommends grabbing a specific box. The item detail screen displays individual batches sorted by expiration date. Imprecise dates like 'Best by March 2026' or 'No date on file' are presented honestly without fabricated days.",
      image: "/mock/expiration1.png",
      icon: Clock,
      highlights: [
        "Literal FEFO queue sorted by expiration date ascending",
        "Honest precision display (month-only or unknown dates)",
        "One-tap Scan Out defaulting to the earliest expiring batch"
      ]
    }
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#F5F5F4] relative overflow-hidden border-b border-[#E7E5E4]">
      <div className="container mx-auto px-6 max-w-[85rem]">
        
        {/* --- Section Header --- */}
        <div 
          className="max-w-3xl mb-16 lg:mb-20 stagger-animate opacity-0"
          style={{ animationDelay: '0.1s', willChange: 'transform, opacity, filter' }}
        >
          <span className="text-[#D97757] font-mono font-semibold text-sm tracking-widest uppercase mb-4 block">
            Mobile Shift Experience
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#1C1917] leading-[1.15] tracking-tight mb-6">
            Mobile speed <span className="italic text-[#D97757]">without friction.</span>
          </h2>
          <p className="text-lg sm:text-xl text-[#57534E] font-light leading-relaxed">
            Built specifically for poor warehouse lighting and fast-paced volunteer shifts. Three intuitive navigation tabs—Home, Inventory, and More—keep the interface clean and action-oriented.
          </p>
        </div>

        {/* --- Interactive Workflow Showcase --- */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          
          {/* Left Column: Interactive Tab List */}
          <div className="w-full lg:w-[52%] flex flex-col gap-5 z-10">
            {mobileWorkflows.map((flow, index) => {
              const isActive = activeTab === index;
              const IconComp = flow.icon;

              return (
                <div 
                  key={flow.id}
                  onClick={() => setActiveTab(index)}
                  className={`p-6 sm:p-8 rounded-[2rem] border transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-white border-[#D97757] shadow-xl translate-x-0 lg:translate-x-2' 
                      : 'bg-white/60 hover:bg-white border-[#E7E5E4] hover:border-[#D6D3D1]'
                  }`}
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                      isActive ? 'bg-[#D97757] text-white' : 'bg-[#1C1917]/5 text-[#1C1917]'
                    }`}>
                      <IconComp size={22} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className={`text-xl sm:text-2xl font-serif tracking-tight transition-colors ${
                          isActive ? 'font-bold text-[#1C1917]' : 'font-semibold text-[#1C1917]/80'
                        }`}>
                          {flow.title}
                        </h3>
                        <span className="font-mono text-xs font-bold text-[#A8A29E] tracking-wider">
                          0{flow.id + 1}
                        </span>
                      </div>

                      <h4 className="text-[15px] sm:text-base font-medium text-[#D97757] mb-3">
                        {flow.tagline}
                      </h4>

                      <p className={`text-[#57534E] font-light leading-relaxed text-sm sm:text-[15px] transition-all duration-300 ${
                        isActive ? 'block mb-5' : 'hidden sm:block'
                      }`}>
                        {flow.description}
                      </p>

                      {/* Bullet Highlights for Active Tab */}
                      {isActive && (
                        <div className="space-y-2.5 pt-3 border-t border-[#E7E5E4]/80 animate-in fade-in duration-500">
                          {flow.highlights.map((point, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#1C1917] font-medium">
                              <CheckCircle2 size={16} className="text-[#D97757] shrink-0" />
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Dynamic Mockup Display */}
          <div className="w-full lg:w-[48%] flex items-center justify-center relative">
            <div className="relative w-full max-w-[440px] aspect-[4/5] sm:aspect-[1/1] lg:aspect-[4/5] rounded-[3rem] bg-gradient-to-b from-[#1C1917] to-[#292524] p-6 sm:p-8 shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden">
              
              {/* Decorative background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#D97757]/20 blur-3xl rounded-full pointer-events-none" />

              {/* Image Transition Deck */}
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-white/10 shadow-inner bg-[#FAFAF9]">
                {mobileWorkflows.map((flow, index) => {
                  const isActive = activeTab === index;
                  return (
                    <div 
                      key={flow.id}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        isActive 
                          ? 'opacity-100 scale-100 z-10 pointer-events-auto' 
                          : 'opacity-0 scale-95 z-0 pointer-events-none'
                      }`}
                    >
                      <Image
                        src={flow.image}
                        alt={flow.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 45vw"
                        className="object-contain object-center p-4"
                        priority={index === 0}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Bottom status badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/15 text-white text-xs font-mono tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D97757] animate-pulse" />
                <span>Screen {activeTab + 1} of {mobileWorkflows.length}</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
