'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Smartphone, Tablet, Monitor, Building2, Barcode, CheckCircle2 } from 'lucide-react';

export default function PersonaSection() {
  const [activeTab, setActiveTab] = useState(0);

  const personas = [
    {
      id: 0,
      role: "Volunteer",
      device: "Phone (Camera Scan)",
      icon: Smartphone,
      tagline: "Scan in, scan out, nothing else. Zero learning curve required.",
      image: "/mock/scann.png",
      capabilities: [
        {
          title: "Instant Barcode Intake",
          description: "Open the camera directly from Home to scan incoming item donations without typing a single word."
        },
        {
          title: "Honest FEFO Distribution",
          description: "Automatically directed to grab the earliest-expiring batch first so food never goes to waste."
        },
        {
          title: "Zero Admin Clutter",
          description: "Deliberately restricted from settings, reports, or billing so volunteers never get lost or overwhelmed."
        }
      ],
      badgeColor: "bg-[#D97757]/20 text-[#D97757] border-[#D97757]/30"
    },
    {
      id: 1,
      role: "Staff & Shift Lead",
      device: "Phone or Tablet",
      icon: Tablet,
      tagline: "High-speed floor coordination & stock lookups.",
      image: "/mock/tablet.png",
      capabilities: [
        {
          title: "High-Speed Floor Intake",
          description: "Coordinate receiving and distribution workflows effortlessly across tablets and mobile phones."
        },
        {
          title: "Live Stock & Expiration Lookup",
          description: "Check instant on-hand quantities and flag expiring items right from the warehouse floor."
        },
        {
          title: "Shift Corrections",
          description: "Make quick inventory adjustments and item removals during busy volunteer distribution shifts."
        }
      ],
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30"
    },
    {
      id: 2,
      role: "Executive Director",
      device: "Desktop Monitor",
      icon: Monitor,
      tagline: "Total administrative oversight & compliance reporting.",
      image: "/mock/dash.png",
      capabilities: [
        {
          title: "Grant-Ready Reporting",
          description: "Export clean CSVs and publication-ready PDFs filtered by program and date range in two clicks."
        },
        {
          title: "Catalog & Category Rules",
          description: "Manage food vs. non-food categories and oversee bulk CSV item imports across your facility."
        },
        {
          title: "Team & Governance Control",
          description: "Manage user invitations, assign granular role permissions, and oversee organization billing."
        }
      ],
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30"
    },
    {
      id: 3,
      role: "Regional Director",
      device: "Desktop & Mobile",
      icon: Building2,
      tagline: "Multi-site network visibility & roll-up analytics.",
      image: "/mock/SideMock2.png",
      capabilities: [
        {
          title: "Multi-Site Roll-Up Dashboard",
          description: "Monitor aggregated pounds in and out across all child pantries in your network simultaneously."
        },
        {
          title: "Instant Location Switching",
          description: "Switch between individual pantries with instant visual color and logo confirmation."
        },
        {
          title: "Network Audit & Oversight",
          description: "Review immutable activity ledgers and track inventory health across every facility in the network."
        }
      ],
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    },
    {
      id: 4,
      role: "Warehouse Staff",
      device: "Desktop + USB Scanner",
      icon: Barcode,
      tagline: "Stationary dock receiving for high-volume intake.",
      image: "/mock/SideMock.png",
      capabilities: [
        {
          title: "Stationary Loading Dock Intake",
          description: "Optimized desktop interface designed for rapid physical USB and Bluetooth barcode scanners."
        },
        {
          title: "High-Volume Batch Processing",
          description: "Rapidly receive pallet deliveries, record weights, and assign expiration dates in bulk."
        },
        {
          title: "Fuzzy Duplicate Prevention",
          description: "Real-time bilingual search prevents duplicate catalog rows during high-speed dock intake."
        }
      ],
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30"
    }
  ];

  const currentPersona = personas[activeTab];
  const IconComp = currentPersona.icon;

  return (
    <section className="py-20 lg:py-24 bg-[#1C1917] text-white relative overflow-hidden border-b border-white/10">
      
      {/* Subtle Ambient Lighting Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#D97757]/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[85rem] relative z-10">
        
        {/* --- Section Header --- */}
        <div className="max-w-3xl mx-auto text-center mb-10 lg:mb-14">
          <span className="text-[#D97757] font-mono font-semibold text-sm tracking-widest uppercase mb-4 block">
            Who&apos;s using Food Arca
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-[1.15] tracking-tight mb-6">
            Tailored precision for <span className="italic text-[#D97757]">every device.</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/80 font-light leading-relaxed">
            Instead of generic boxes, explore how Food Arca transforms its interface for each role on your team. Select a user type below to see exactly what they can do in the app.
          </p>
        </div>

        {/* --- BALANCED, CENTERED ROLE TILES/PILLS --- */}
        <div className="flex overflow-x-auto no-scrollbar justify-start sm:justify-center sm:flex-wrap gap-3 sm:gap-4 mb-10 sm:mb-14 w-full pb-2 sm:pb-0">
          {personas.map((persona, index) => {
            const isActive = activeTab === index;
            const TabIcon = persona.icon;
            
            return (
              <button
                key={persona.id}
                onClick={() => setActiveTab(index)}
                className={`group relative min-h-[44px] whitespace-nowrap px-6 py-3.5 rounded-2xl font-inter text-sm sm:text-base transition-all duration-300 flex items-center gap-2.5 shrink-0 border cursor-pointer ${
                  isActive
                    ? 'bg-[#D97757] text-white font-bold border-[#D97757] shadow-[0_4px_25px_rgba(217,119,87,0.45)] scale-105'
                    : 'bg-white/5 text-white/75 font-semibold border-white/15 hover:bg-white/10 hover:text-white hover:border-white/30 hover:-translate-y-0.5'
                }`}
              >
                <TabIcon size={18} className={isActive ? 'text-white' : 'text-[#D97757] group-hover:scale-110 transition-transform'} />
                <span>{persona.role}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* --- INTERACTIVE PERSONA SHOWCASE CARD --- */}
        <div className="bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-4 sm:p-8 lg:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-500">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Left Column: Role Identity & Clean Text List (Span 7) */}
            <div className="lg:col-span-7 flex flex-col justify-between order-2 lg:order-1">
              
              {/* Top Badge & Role Name */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${currentPersona.badgeColor}`}>
                    {currentPersona.device}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#D97757] text-white flex items-center justify-center shadow-lg shrink-0">
                    <IconComp size={28} />
                  </div>
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
                    {currentPersona.role}
                  </h3>
                </div>

                {/* Tagline only (REMOVED bottom paragraph noise!) */}
                <h4 className="text-lg sm:text-xl font-medium text-[#D97757] mb-8">
                  {currentPersona.tagline}
                </h4>
              </div>

              {/* CLEAN, ELEGANT TEXT BULLET POINTS (Using CheckCircle2 instead of glowing dots!) */}
              <div className="space-y-6 pt-6 border-t border-white/15">
                {currentPersona.capabilities.map((cap, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    {/* Replaced glowing dot with CheckCircle2 */}
                    <CheckCircle2 size={20} className="text-[#D97757] shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-lg sm:text-xl font-semibold text-white mb-1">
                        {cap.title}
                      </h5>
                      <p className="text-white/75 font-light text-base leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Column: Clean Mockup Preview (Span 5) */}
            <div className="lg:col-span-5 flex items-center justify-center relative order-1 lg:order-2 mb-8 lg:mb-0">
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent p-4 sm:p-6 border border-white/15 shadow-2xl flex items-center justify-center overflow-hidden">
                
                {/* Decorative glowing behind image */}
                <div className="absolute inset-0 bg-[#D97757]/10 blur-2xl rounded-full pointer-events-none" />

                {/* Image Transition Container */}
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-[#FAFAF9]">
                  {personas.map((persona, index) => {
                    const isTabActive = activeTab === index;
                    return (
                      <div 
                        key={persona.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                          isTabActive 
                            ? 'opacity-100 scale-100 z-10 pointer-events-auto' 
                            : 'opacity-0 scale-95 z-0 pointer-events-none'
                        }`}
                      >
                        <Image
                          src={persona.image}
                          alt={persona.role}
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-contain object-center p-2 sm:p-4"
                          priority={index === 0}
                        />
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
