'use client';

import React from 'react';
import {
  ScanBarcode,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export default function EcosystemSection() {
  return (
    <section className="py-24 md:py-32 bg-[#1C1917] text-[#FAFAF9] relative border-t border-white/5 overflow-hidden">
      
      {/* Background: Subtle top spotlight to give depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[400px] bg-[#D97757]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* --- Header (Kept per your request) --- */}
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

          {/* --- CARD 1: CAPTURE (Scan) --- */}
          <div className="group relative bg-[#27272A] border border-white/10 rounded-3xl p-8 lg:p-10 flex flex-col h-full hover:border-[#D97757]/50 transition-colors duration-500">
            {/* Icon Container */}
            <div className="mb-8 w-16 h-16 rounded-2xl bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center group-hover:bg-[#D97757] group-hover:text-white transition-all duration-500 text-[#D97757]">
              <ScanBarcode size={32} />
            </div>

            {/* Text Content */}
            <div className="mt-auto">
              <h3 className="text-2xl font-serif text-white mb-4">1. Scan & Log</h3>
              <p className="text-[#A8A29E] font-light leading-relaxed mb-6">
                Scan an item once. The system pulls basic details instantly. No more manual typing or guessing what's in the box.
              </p>
              
              {/* Micro-feature list for detail */}
              <ul className="space-y-2 text-sm text-[#71717A]">
                <li className="flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-[#D97757]" /> Mobile Camera Support
                </li>
                <li className="flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-[#D97757]" /> Instant Identification
                </li>
              </ul>
            </div>
          </div>

          {/* --- CARD 2: SYNC (Cloud) --- */}
          <div className="group relative bg-[#27272A] border border-white/10 rounded-3xl p-8 lg:p-10 flex flex-col h-full hover:border-[#D97757]/50 transition-colors duration-500">
            {/* Icon Container */}
            <div className="mb-8 w-16 h-16 rounded-2xl bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center group-hover:bg-[#D97757] group-hover:text-white transition-all duration-500 text-[#D97757]">
              <RefreshCw size={32} />
            </div>

            {/* Text Content */}
            <div className="mt-auto">
              <h3 className="text-2xl font-serif text-white mb-4">2. Global Sync</h3>
              <p className="text-[#A8A29E] font-light leading-relaxed mb-6">
                The moment an item is scanned, it's visible to the whole organization. From the warehouse floor to the director's laptop.
              </p>

              <ul className="space-y-2 text-sm text-[#71717A]">
                <li className="flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-[#D97757]" /> Real-time Updates
                </li>
                <li className="flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-[#D97757]" /> Unlimited Users
                </li>
              </ul>
            </div>
          </div>

          {/* --- CARD 3: COMPLY (Export) --- */}
          <div className="group relative bg-[#27272A] border border-white/10 rounded-3xl p-8 lg:p-10 flex flex-col h-full hover:border-[#D97757]/50 transition-colors duration-500">
            {/* Icon Container */}
            <div className="mb-8 w-16 h-16 rounded-2xl bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center group-hover:bg-[#D97757] group-hover:text-white transition-all duration-500 text-[#D97757]">
              <FileSpreadsheet size={32} />
            </div>

            {/* Text Content */}
            <div className="mt-auto">
              <h3 className="text-2xl font-serif text-white mb-4">3. Grant Compliance</h3>
              <p className="text-[#A8A29E] font-light leading-relaxed mb-6">
                Automatically calculate item value, waste, and client history. Export audit-ready reports for federal programs in one click.
              </p>

              <ul className="space-y-2 text-sm text-[#71717A]">
                <li className="flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-[#D97757]" /> Estimate Value Tracking
                </li>
                <li className="flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-[#D97757]" /> CSV & Excel Exports
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}