import React from 'react';
import Image from 'next/image';
import { Palette, Globe, ShieldCheck, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export default function NetworkGovernanceSection() {
  const roles = [
    {
      name: "Volunteer",
      permissions: "Receive Stock, Distribute Stock, Search & Browse, view Item Detail.",
      restrictions: "Cannot remove items, access settings, view reports, or switch locations.",
      badge: "Base Role"
    },
    {
      name: "Staff+",
      permissions: "Create catalog items directly, discontinue stock, and view daily shift metrics.",
      restrictions: "Cannot manage user accounts, location settings, or organization billing.",
      badge: "Floor Lead"
    },
    {
      name: "Admin+",
      permissions: "Invite & manage users, configure location rules, and run full grant exports.",
      restrictions: "Cannot modify subscription plans, change billing, or delete the organization.",
      badge: "Site Manager"
    },
    {
      name: "Owner+",
      permissions: "Full control over subscription plans, network billing, and child pantry creation.",
      restrictions: "Unrestricted administrative access across the entire pantry network.",
      badge: "Network Head"
    }
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#1C1917] text-white relative overflow-hidden">
      
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D97757]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1E293B]/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 max-w-[85rem] relative z-10">
        
        {/* --- Section Header --- */}
        <div 
          className="max-w-3xl mb-16 lg:mb-20 stagger-animate opacity-0"
          style={{ animationDelay: '0.1s', willChange: 'transform, opacity, filter' }}
        >
          <span className="text-[#D97757] font-mono font-semibold text-sm tracking-widest uppercase mb-4 block">
            Governance & Multi-Site Scale
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-[1.15] tracking-tight mb-6">
            Multi-pantry switching & <span className="italic text-[#D97757]">role security.</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/80 font-light leading-relaxed">
            Scale across regional networks with confidence. Food Arca combines visual site disambiguation with strict permission hierarchies so every team member operates safely within their scope.
          </p>
        </div>

        {/* --- Two Column Feature Cards --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: At-a-Glance Branding & Multi-Pantry Switching (Span 6) */}
          <div 
            className="lg:col-span-6 bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 lg:p-12 backdrop-blur-md flex flex-col justify-between stagger-animate opacity-0"
            style={{ animationDelay: '0.25s', willChange: 'transform, opacity, filter' }}
          >
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#D97757]/20 border border-[#D97757]/30 flex items-center justify-center text-[#D97757]">
                  <Palette size={24} />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                    At-a-Glance Site Branding
                  </h3>
                  <span className="text-xs font-mono text-white/60 uppercase tracking-widest">
                    Disambiguation Without Complexity
                  </span>
                </div>
              </div>

              <p className="text-white/80 font-light leading-relaxed text-[15px] sm:text-base mb-8">
                Assign a single accent color and optional logo to each organization in your network. A Regional Director switching between three pantries all day gets instant visual confirmation (&ldquo;this one&apos;s blue, that one&apos;s green&rdquo;) without ever second-guessing which site they are operating in.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <Globe className="text-[#D97757] shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-1">Instant RLS Location Scoping</h4>
                    <p className="text-white/70 text-xs font-light leading-relaxed">
                      Tapping a location in the switcher re-scopes the entire application in real-time, backed by row-level database security.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <CheckCircle2 className="text-[#D97757] shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-1">Switcher vs. Roll-Up Views</h4>
                    <p className="text-white/70 text-xs font-light leading-relaxed">
                      Switching means looking at one pantry at a time; the desktop roll-up view lets regional leaders see all locations aggregated at once.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Accent Box */}
            <div className="w-full bg-gradient-to-r from-[#D97757]/20 via-white/5 to-transparent p-6 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#D97757] shadow-[0_0_12px_#D97757]" />
                <span className="font-mono text-sm font-semibold tracking-wide">Downtown Community Pantry</span>
              </div>
              <span className="text-xs font-mono text-[#D97757] uppercase tracking-wider bg-[#D97757]/10 px-3 py-1 rounded-full border border-[#D97757]/20">
                Active Scope
              </span>
            </div>
          </div>

          {/* Right Column: Granular Role Security (Span 6) */}
          <div 
            className="lg:col-span-6 bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 lg:p-12 backdrop-blur-md flex flex-col justify-between stagger-animate opacity-0"
            style={{ animationDelay: '0.4s', willChange: 'transform, opacity, filter' }}
          >
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                    Granular Role Security
                  </h3>
                  <span className="text-xs font-mono text-white/60 uppercase tracking-widest">
                    Clear Separation of Concerns
                  </span>
                </div>
              </div>

              <p className="text-white/80 font-light leading-relaxed text-[15px] sm:text-base mb-8">
                What roles can actually do—not just names in an enum. An Admin at one location in a network cannot touch the parent organization&apos;s billing or settings, keeping child pantries autonomous and secure.
              </p>

              {/* Roles List */}
              <div className="space-y-4">
                {roles.map((role, idx) => (
                  <div 
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#D97757]/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <Users size={16} className="text-[#D97757]" />
                        <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#D97757] transition-colors">
                          {role.name}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-white/80">
                        {role.badge}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/90 font-medium mb-1.5">
                      <span className="text-[#D97757] font-semibold">Can do:</span> {role.permissions}
                    </p>
                    <p className="text-xs text-white/50 font-light">
                      <span className="text-white/70 font-medium">Restricted:</span> {role.restrictions}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
