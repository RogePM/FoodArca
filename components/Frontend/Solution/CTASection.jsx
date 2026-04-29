'use client';

import React, { useState } from 'react';
import CTAActions from './CTAActions';
import AnimatedImageGrid from './AnimatedImageGrid';

export default function TrustPricingSection() {
    const [activeTab, setActiveTab] = useState('small');

    const tiers = {
        small: {
            id: 'small',
            label: "Small Pantry",
            title: "Perfect for single-site local operations.",
            description: "Start with our free tier. It makes it incredibly easy to intake and distribute up to 50 items at a time without the usual spreadsheet chaos."
        },
        medium: {
            id: 'medium',
            label: "Regional & Medium",
            title: "Built for growing and collaborative teams.",
            description: "Invite up to 10 users to work simultaneously. Speed up your distribution lines and keep everyone in sync in real-time."
        },
        enterprise: {
            id: 'enterprise',
            label: "Enterprise",
            title: "Tailored to complex, multi-site networks.",
            description: "Unlimited team members and clients. Seamlessly manage inventory across multiple locations with advanced routing and ITSM capabilities."
        }
    };

    const currentTier = tiers[activeTab];

    return (
        <section className="relative py-16 lg:py-40 bg-[#D97757]/[0.08] border-y border-[#D97757]/20 overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/60 to-transparent pointer-events-none -z-10"></div>

            <div className="container mx-auto px-6 max-w-[85rem]">

                <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 lg:gap-24">

                    {/* --- LEFT COLUMN: Image Grid --- */}
                    <div 
                        className="order-2 lg:order-1 stagger-animate opacity-0 w-full lg:w-[45%] flex justify-start z-10 mt-8 lg:mt-0"
                        style={{ animationDelay: '0.2s', willChange: 'transform, opacity, filter' }}
                    >
                        <div className="w-full max-w-[600px] flex justify-start">
                            <AnimatedImageGrid />
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: Text & Tabs --- */}
                    <div className="order-1 lg:order-2 w-full lg:w-[55%] flex flex-col items-start text-left z-10">
                        
                        <h2 
                            className="stagger-animate opacity-0 text-4xl sm:text-5xl lg:text-6xl font-serif text-[#1C1917] leading-[1.15] lg:leading-[1.1] tracking-tight mb-10 w-full"
                            style={{ animationDelay: '0s', willChange: 'transform, opacity, filter' }}
                        >
                            The inventory system food banks <span className="relative inline-block z-10">deserve
                                <svg className="absolute -bottom-2 -left-1 w-[105%] h-5 -z-10 text-[#D97757]/40" viewBox="0 0 120 15" preserveAspectRatio="none">
                                    <path d="M2.38 10.37C17.2 9.08 32.06 7.6 46.91 6.38C53.95 5.8 61 5.31 68.04 4.89C76.99 4.36 85.94 3.93 94.89 3.59C96.34 3.53 97.79 3.48 99.24 3.44C100.28 3.41 101.32 3.39 102.36 3.37M11.66 12.01C25.4 10.99 39.15 9.87 52.88 8.87C62.96 8.14 73.04 7.52 83.12 7C91.95 6.55 100.77 6.19 109.6 5.92C110.83 5.88 112.06 5.85 113.29 5.82C114.36 5.8 115.42 5.77 116.49 5.76" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                </svg>
                            </span>.
                        </h2>

                        {/* MINIMALIST EDITORIAL TABS */}
                        <div 
                            className="stagger-animate opacity-0 flex flex-nowrap overflow-x-auto w-full border-b border-[#E7E5E4] mb-8 gap-6 sm:gap-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            style={{ animationDelay: '0.15s', willChange: 'transform, opacity, filter' }}
                        >
                            {Object.values(tiers).map((tier) => (
                                <button
                                    key={tier.id}
                                    onClick={() => setActiveTab(tier.id)}
                                    // Added the 'group' class here to control the hover underline!
                                    className={`group relative pb-4 text-[17px] sm:text-lg font-medium transition-colors whitespace-nowrap outline-none ${
                                        activeTab === tier.id 
                                            ? 'text-[#1C1917]' 
                                            : 'text-[#A8A29E] hover:text-[#57534E]'
                                    }`}
                                >
                                    {tier.label}
                                    
                                    {/* Hover Underline (Only shows on inactive tabs when hovered) */}
                                    {activeTab !== tier.id && (
                                        <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#D6D3D1] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                    )}

                                    {/* Animated Active Border Indicator (Now h-[4px] to pop more!) */}
                                    {activeTab === tier.id && (
                                        <div className="absolute bottom-[-1px] left-0 w-full h-[4px] bg-[#D97757] animate-in fade-in zoom-in-95 duration-300 rounded-t-full shadow-sm" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* TAB CONTENT (DYNAMIC) */}
                        <div 
                            className="stagger-animate opacity-0 min-h-[140px] flex flex-col justify-start w-full"
                            style={{ animationDelay: '0.2s', willChange: 'transform, opacity, filter' }}
                        >
                            <h3 key={`title-${activeTab}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-xl sm:text-2xl font-serif text-[#1C1917] mb-3">
                                {currentTier.title}
                            </h3>
                            
                            <p key={`desc-${activeTab}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-[17px] text-[#57534E] font-inter font-light max-w-xl leading-relaxed mb-6">
                                {currentTier.description}
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div 
                            className="stagger-animate opacity-0 mt-2 w-full"
                            style={{ animationDelay: '0.3s', willChange: 'transform, opacity, filter' }}
                        >
                            <CTAActions />
                        </div>
                        
                    </div>

                </div>

            </div>
        </section>
    );
}