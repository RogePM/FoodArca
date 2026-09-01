'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Bell, 
  Building2, 
  Gauge, 
  HelpCircle, 
  ChevronRight,
  LogOut
} from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { MobileInventorySearch } from '@/components/ui/mobile-inventory-search';
import { createBrowserClient } from '@supabase/ssr';


// Custom SVG matching the exact style for Activity Log (history receipt + orange rewind loop)
function ActivityLogIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full object-contain" fill="none">
      {/* Soft pastel peach circle - slightly more defined */}
      <circle cx="50" cy="50" r="38" fill="#fed7aa" />
      {/* History Sheet */}
      <rect x="26" y="24" width="38" height="52" rx="8" fill="#ffffff" stroke="#bae6fd" strokeWidth="2" />
      <rect x="32" y="32" width="26" height="4" rx="2" fill="#bfdbfe" />
      <rect x="32" y="40" width="20" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="32" y="46" width="24" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="32" y="52" width="16" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="32" y="58" width="22" height="3" rx="1.5" fill="#e2e8f0" />
      {/* Orange Undo / Rewind Arrow */}
      <path d="M 64 34 A 20 20 0 1 1 50 72" stroke="#f97316" strokeWidth="6" strokeLinecap="round" />
      <polygon points="60,22 74,32 60,42" fill="#f97316" />
      <circle cx="50" cy="52" r="4" fill="#453225" />
    </svg>
  );
}

export function SettingsView({ activeView, setActiveView }) {
    const { details } = usePantry();
    const [activeModal, setActiveModal] = useState(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const sections = [
      {
        title: "Workspace & Team",
        items: [
          { id: 'organization', title: 'Pantry Details', imageSrc: '/images/workspace/pantry-details.jpg' },
          { id: 'team', title: 'Team Members', imageSrc: '/images/workspace/team-members.jpg' },
          { id: 'billing', title: 'Billing & Plans', imageSrc: '/images/workspace/billing-plans.jpg' },
        ]
      },
      {
        title: "Account & Data",
        items: [
          { id: 'profile', title: 'My Profile', imageSrc: '/images/workspace/my-profile.jpg' },
          { id: 'export', title: 'Data Export', imageSrc: '/images/workspace/data-export.jpg' },
          { id: 'activity', title: 'Activity Log', customIcon: ActivityLogIcon },
        ]
      }
    ];

    const moreTools = [
      {
        id: 'notifications',
        title: 'Notifications & Expiration Alerts',
        description: 'Set up warnings for expiring food and daily tasks.',
        icon: Bell,
      },
      {
        id: 'switch_org',
        title: 'Switch or Join Organization',
        description: 'Manage multiple branches or join a food bank network.',
        icon: Building2,
      },
      {
        id: 'plan_limits',
        title: 'Plan Limits & Resource Usage',
        description: 'View your active item count, limits, and team seats.',
        icon: Gauge,
      },
      {
        id: 'help',
        title: 'Help & Volunteer Guide',
        description: 'Onboarding tips, documentation, and support.',
        icon: HelpCircle,
      },
    ];

    return (
        <div className="flex-1 w-full flex flex-col bg-white shrink-0">
            
            {/* MOBILE NATIVE HEADER / GLOBAL SEARCH */}
            <div className="z-20 sticky top-0 bg-[#d97757] md:bg-white px-4 md:px-6 pt-3 pb-2 shadow-[0_1px_0_0_#d97757] md:shadow-none transition-colors shrink-0 md:hidden">
                <MobileInventorySearch />
            </div>

            <div className="max-w-2xl mx-auto w-full px-4 md:px-6 pt-6 pb-12 space-y-8">
                
                {/* SECTIONS GRID */}
                <div className="space-y-8">
                    {sections.map((section, idx) => (
                        <div key={idx}>
                            <h2 className="text-[16px] font-medium text-gray-900 mb-3 tracking-tight">
                                {section.title}
                            </h2>
                            
                            {/* 3-COLUMN GRID */}
                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                {section.items.map((item) => {
                                    const CustomComponent = item.customIcon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveModal(item.id)}
                                            className="bg-white border border-gray-300/70 rounded-2xl p-2.5 flex flex-col items-center justify-between shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] aspect-[3/4.3] hover:border-gray-400 active:scale-95 transition-all duration-200 overflow-hidden group"
                                        >
                                            <div className="flex-1 w-full flex items-center justify-center pt-2 px-1">
                                                {item.imageSrc ? (
                                                    <img
                                                        src={item.imageSrc}
                                                        alt={item.title}
                                                        className="w-full h-full max-h-[96px] object-contain mix-blend-multiply scale-110 group-hover:scale-115 transition-transform duration-200"
                                                    />
                                                ) : CustomComponent ? (
                                                    <div className="w-full h-full max-h-[96px] flex items-center justify-center scale-110 group-hover:scale-115 transition-transform duration-200">
                                                        <CustomComponent />
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="h-[36px] w-full flex items-center justify-center pb-1">
                                                <span className="text-[13px] font-normal text-gray-800 text-center leading-tight px-1">
                                                    {item.title}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* MORE TOOLS & PREFERENCES (SAMS CLUB LIST CARD STYLE) */}
                <div className="bg-white border border-gray-300/70 rounded-2xl p-4 md:p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                    <h2 className="text-[16px] font-medium text-gray-900 mb-3 tracking-tight">
                        More Tools & Preferences
                    </h2>
                    <div className="divide-y divide-gray-100">
                        {moreTools.map((tool) => {
                            const IconComponent = tool.icon;
                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => setActiveModal(tool.id)}
                                    className="w-full flex items-center justify-between py-3.5 hover:bg-gray-50/70 -mx-2 px-2 rounded-xl transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-3.5 pr-2">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200/80 flex items-center justify-center flex-shrink-0 text-gray-700 group-hover:text-[#d97757] group-hover:border-[#d97757]/30 transition-colors">
                                            <IconComponent className="h-5 w-5" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-[14px] font-medium text-gray-900 leading-snug group-hover:text-[#d97757] transition-colors">
                                                {tool.title}
                                            </h3>
                                            <p className="text-[12px] text-gray-500 leading-snug mt-0.5">
                                                {tool.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4.5 w-4.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* SIGN OUT BUTTON */}
                <button 
                    onClick={handleSignOut}
                    className="w-full bg-white border border-red-200 text-red-600 rounded-2xl p-4 flex items-center justify-center gap-2 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:bg-red-50 active:scale-95 transition-all duration-200 font-medium"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>

            </div>
        </div>
    );
}