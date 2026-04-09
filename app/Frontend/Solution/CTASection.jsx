import React from 'react';
import CTAActions from './CTAActions';
import AnimatedImageGrid from './AnimatedImageGrid';

export default function CTASection() {
    return (
        // Reduced vertical padding slightly so the card sits better on the screen
        <section className="py-16 lg:py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">

                {/* CHANGED: Tighter padding (p-6 sm:p-10 lg:p-16) and reduced mobile gap (gap-10) */}
                {/* Adjusted the border radius slightly on mobile so it doesn't eat up content space */}
                <div className="relative bg-[#D97757]/10 rounded-[2rem] lg:rounded-[3rem] p-6 sm:p-10 lg:p-16 overflow-hidden flex flex-col lg:flex-row items-center gap-10 lg:gap-20 shadow-sm border border-[#D97757]/20">

                    {/* Subtle ambient glow */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none -z-10"></div>

                    {/* Left Column: Static Text & Buttons */}
                    <div className="w-full lg:w-1/2 flex flex-col items-center text-center lg:items-start lg:text-left z-10">
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#1C1917] leading-[1.1] tracking-tight mb-5">
                            The inventory system food banks <span className="relative inline-block z-10">deserve
                                {/* Background Brush Stroke SVG */}
                                <svg className="absolute -bottom-2 -left-1 w-[105%] h-5 -z-10 text-[#D97757]/40" viewBox="0 0 120 15" preserveAspectRatio="none">
                                    <path d="M2.38 10.37C17.2 9.08 32.06 7.6 46.91 6.38C53.95 5.8 61 5.31 68.04 4.89C76.99 4.36 85.94 3.93 94.89 3.59C96.34 3.53 97.79 3.48 99.24 3.44C100.28 3.41 101.32 3.39 102.36 3.37M11.66 12.01C25.4 10.99 39.15 9.87 52.88 8.87C62.96 8.14 73.04 7.52 83.12 7C91.95 6.55 100.77 6.19 109.6 5.92C110.83 5.88 112.06 5.85 113.29 5.82C114.36 5.8 115.42 5.77 116.49 5.76" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                </svg>
                            </span>.
                        </h2>

                        <p className="text-lg sm:text-xl text-[#57534E] font-light max-w-lg">
                            Real-time tracking built for pantries, food banks, and distribution centers on the frontlines of food insecurity. 
                        </p>

                        {/* Client Island 1: Buttons */}
                        <CTAActions />
                    </div>

                    {/* Right Column: Animated Image Grid */}
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-end z-10 mt-4 lg:mt-0">
                        <AnimatedImageGrid />
                    </div>

                </div>

            </div>
        </section>
    );
}