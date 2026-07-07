import React from 'react';
import Image from 'next/image';
import { BarChart3, FileSpreadsheet, Layers, Search, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DesktopPowerhouseSection() {
  return (
    <section className="py-24 lg:py-32 bg-white overflow-hidden border-b border-[#E7E5E4]">
      <div className="container mx-auto px-6 max-w-[85rem]">
        
        {/* --- Section Header --- */}
        <div 
          className="max-w-3xl mb-16 lg:mb-20 stagger-animate opacity-0"
          style={{ animationDelay: '0.1s', willChange: 'transform, opacity, filter' }}
        >
          <span className="text-[#D97757] font-mono font-semibold text-sm tracking-widest uppercase mb-4 block">
            Enterprise Desktop Suite
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#1C1917] leading-[1.15] tracking-tight mb-6">
            Complete command over <span className="italic text-[#D97757]">your facility.</span>
          </h2>
          <p className="text-lg sm:text-xl text-[#57534E] font-light leading-relaxed">
            While volunteers move fast on mobile, executive directors and warehouse staff gain deep analytical control on desktop. Monitor roll-up metrics, manage bulk catalogs, and generate grant-ready reports effortlessly.
          </p>
        </div>

        {/* --- Bento Grid Layout --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Card 1: Real-Time Dashboard (Span 8) */}
          <div 
            className="md:col-span-8 bg-[#1E293B] text-white rounded-[2.5rem] p-8 sm:p-10 lg:p-12 shadow-xl overflow-hidden relative flex flex-col justify-between group stagger-animate opacity-0 min-h-[480px] lg:min-h-[540px]"
            style={{ animationDelay: '0.2s', willChange: 'transform, opacity, filter' }}
          >
            <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-black/30 to-transparent z-0 pointer-events-none" />
            
            <div className="relative z-10 max-w-xl mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono uppercase tracking-wider text-[#D97757] mb-6">
                <BarChart3 size={14} />
                <span>Live Analytics</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-tight mb-4">
                Real-Time Roll-Up Dashboard
              </h3>
              <p className="text-white/80 font-light leading-relaxed text-[15px] sm:text-base">
                Track pounds in and out this month, monitor category breakdowns, view stock expiring soon, and flag undated items needing review—all aggregated instantly across your locations.
              </p>
            </div>

            <div className="relative z-10 w-full h-[240px] sm:h-[300px] mt-auto rounded-t-2xl overflow-hidden border border-white/15 shadow-2xl translate-y-4 group-hover:translate-y-1 transition-transform duration-500">
              <Image 
                src="/mock/dash.png"
                alt="Real-Time Dashboard"
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Card 2: Grant-Ready Exports (Span 4) */}
          <div 
            className="md:col-span-4 bg-[#78716C] text-white rounded-[2.5rem] p-8 sm:p-10 shadow-xl overflow-hidden relative flex flex-col justify-between group stagger-animate opacity-0 min-h-[480px] lg:min-h-[540px]"
            style={{ animationDelay: '0.35s', willChange: 'transform, opacity, filter' }}
          >
            <div className="relative z-10 mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono uppercase tracking-wider text-white mb-6">
                <FileSpreadsheet size={14} />
                <span>One-Click Compliance</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight leading-tight mb-4">
                Grant-Ready Export Suite
              </h3>
              <p className="text-white/90 font-light leading-relaxed text-sm sm:text-[15px]">
                Generate formatted reports tailored for specific grant programs and date ranges. Export clean CSVs or publication-ready PDFs in just two clicks.
              </p>
            </div>

            <div className="relative z-10 w-full h-[220px] rounded-2xl overflow-hidden border border-white/20 shadow-2xl mt-auto group-hover:scale-[1.03] transition-transform duration-500">
              <Image 
                src="/mock/grants.png"
                alt="Grant Exports"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Card 3: Stationary Intake Desk (Span 5) */}
          <div 
            className="md:col-span-5 bg-[#D97757] text-white rounded-[2.5rem] p-8 sm:p-10 shadow-xl overflow-hidden relative flex flex-col justify-between group stagger-animate opacity-0 min-h-[440px]"
            style={{ animationDelay: '0.5s', willChange: 'transform, opacity, filter' }}
          >
            <div className="relative z-10 mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-mono uppercase tracking-wider text-white mb-6">
                <Search size={14} />
                <span>High-Volume Intake</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight leading-tight mb-4">
                Stationary Desk Intake
              </h3>
              <p className="text-white/90 font-light leading-relaxed text-sm sm:text-[15px]">
                Designed for warehouse staff operating at stationary desks with physical USB or Bluetooth barcode scanners. Process incoming shipments and bulk receiving at lightning speed.
              </p>
            </div>

            <div className="relative z-10 w-full h-[200px] rounded-2xl overflow-hidden border border-white/20 shadow-2xl mt-auto group-hover:scale-[1.03] transition-transform duration-500">
              <Image 
                src="/mock/SideMock.png"
                alt="Stationary Intake"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-left-top"
              />
            </div>
          </div>

          {/* Card 4: Catalog & Bulk Management (Span 7) */}
          <div 
            className="md:col-span-7 bg-[#FAFAF9] text-[#1C1917] border border-[#E7E5E4] rounded-[2.5rem] p-8 sm:p-10 lg:p-12 shadow-sm hover:shadow-xl overflow-hidden relative flex flex-col justify-between group stagger-animate opacity-0 min-h-[440px]"
            style={{ animationDelay: '0.65s', willChange: 'transform, opacity, filter' }}
          >
            <div className="max-w-xl mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C1917]/5 border border-[#1C1917]/10 text-xs font-mono uppercase tracking-wider text-[#D97757] mb-6">
                <Layers size={14} />
                <span>Catalog Control</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-tight mb-4">
                Bulk Catalog & Category Rules
              </h3>
              <p className="text-[#57534E] font-light leading-relaxed text-[15px] sm:text-base mb-6">
                Maintain a clean, standardized catalog across your network. Perform bulk CSV imports and exports, configure food vs. non-food category rules, and rely on live fuzzy matching to prevent duplicate item creation.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E7E5E4]">
                <div className="flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                  <CheckCircle2 size={16} className="text-[#D97757]" />
                  <span>Bulk CSV import & export</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                  <CheckCircle2 size={16} className="text-[#D97757]" />
                  <span>Live fuzzy duplicate prevention</span>
                </div>
              </div>
            </div>

            <div className="w-full h-[180px] rounded-2xl overflow-hidden border border-[#E7E5E4] shadow-md relative group-hover:translate-y-[-4px] transition-transform duration-500">
              <Image 
                src="/mock/dash2.png"
                alt="Catalog Management"
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-top"
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
