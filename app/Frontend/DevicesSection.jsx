'use client';

import React from 'react';
import {
  ScanBarcode,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    title: "1. Scan & Log",
    icon: ScanBarcode,
    description: "Scan an item once. The system pulls basic details instantly. No more manual typing or guessing what's in the box.",
    points: ["Mobile Camera Support", "Instant Identification"]
  },
  {
    title: "2. Global Sync",
    icon: RefreshCw,
    description: "The moment an item is scanned, it's visible to the whole organization. From the warehouse floor to the director's laptop.",
    points: ["Real-time Updates", "Unlimited Users"]
  },
  {
    title: "3. Grant Compliance",
    icon: FileSpreadsheet,
    description: "Automatically calculate item value, waste, and client history. Export audit-ready reports for federal programs in one click.",
    points: ["Estimate Value Tracking", "CSV & Excel Exports"]
  }
];

export default function EcosystemSection() {
  return (
    <section className="py-24 md:py-32 bg-[#1C1917] text-[#FAFAF9] relative border-t border-white/5 overflow-hidden">
      
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[400px] bg-[#D97757]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* --- Header --- */}
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6">
            One continuous workflow.
          </h2>
          <p className="text-lg md:text-xl text-[#A8A29E] font-light max-w-2xl mx-auto leading-relaxed">
            Data flows seamlessly across your entire team in real-time. From the loading dock to the grant report.
          </p>
        </div>

        {/* --- The Process Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-[#27272A] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-full hover:border-[#D97757]/50 transition-colors duration-300"
            >
              
              {/* Top Section: Icon & Text */}
              <div className="p-8 lg:p-10 flex-grow">
                {/* Icon */}
                <div className="mb-6 w-16 h-16 rounded-2xl bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center text-[#D97757] group-hover:bg-[#D97757] group-hover:text-white transition-all duration-300">
                  <feature.icon size={32} strokeWidth={1.5} />
                </div>

                <h3 className="text-2xl font-serif text-white mb-4">
                  {feature.title}
                </h3>
                {/* Text is explicitly light gray, not dark */}
                <p className="text-[#D6D3D1] font-light leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Bottom Section: The List (Visibly separated) */}
              <div className="bg-white/5 p-6 lg:px-10 border-t border-white/10">
                <ul className="space-y-3">
                  {feature.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {/* Icon is bright orange */}
                      <div className="text-[#D97757] shrink-0">
                         <CheckCircle2 size={20} />
                      </div>
                      {/* Text is PURE WHITE to ensure visibility */}
                      <span className="text-white font-medium text-sm md:text-base">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}