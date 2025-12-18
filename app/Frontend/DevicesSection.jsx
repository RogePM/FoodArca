'use client';

import React, { useEffect, useRef } from 'react';
import {
    ScanLine, Wifi, ArrowDown, LayoutGrid, Users, Settings, Search
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function EcosystemSection() {
    const containerRef = useRef(null);
    const ballRef = useRef(null);
    const mobileBallRef = useRef(null);

    const phoneAlertRef = useRef(null);
    const tabletCardRef = useRef(null);
    const laptopRowRef = useRef(null);

    const mPhoneAlertRef = useRef(null);
    const mTabletCardRef = useRef(null);
    const mLaptopRowRef = useRef(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();

        // DESKTOP
        mm.add("(min-width: 1024px)", () => {
            const tl = gsap.timeline({
                repeat: -1,
                defaults: { ease: "power2.inOut" },
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 60%",
                    toggleActions: "play pause resume pause"
                }
            });

            tl.set(ballRef.current, { left: "13%", opacity: 0 });
            tl.fromTo(phoneAlertRef.current, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 });
            tl.to(ballRef.current, { opacity: 1, duration: 0.3 }, "<0.1");
            tl.to(ballRef.current, { left: "50%", duration: 1.5 });
            tl.fromTo(tabletCardRef.current,
                { backgroundColor: "rgba(255, 255, 255, 0.7)" },
                { backgroundColor: "rgba(217, 119, 87, 0.1)", duration: 0.3, yoyo: true, repeat: 1 },
                ">-0.3"
            );
            tl.to(ballRef.current, { left: "87%", duration: 1.5 });
            tl.fromTo(laptopRowRef.current,
                { backgroundColor: "transparent" },
                { backgroundColor: "rgba(217, 119, 87, 0.08)", duration: 0.3, yoyo: true, repeat: 1 },
                ">-0.3"
            );
            tl.to({}, { duration: 0.8 });
            tl.to([phoneAlertRef.current, ballRef.current], { opacity: 0, duration: 0.5 });
        });

        // MOBILE
        mm.add("(max-width: 1023px)", () => {
            const tl = gsap.timeline({
                repeat: -1,
                defaults: { ease: "power2.inOut" },
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 60%",
                    toggleActions: "play pause resume pause"
                }
            });

            tl.set(mobileBallRef.current, { top: "110px", opacity: 0 });
            tl.fromTo(mPhoneAlertRef.current, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
            tl.to(mobileBallRef.current, { opacity: 1, duration: 0.3 }, "<0.1");
            tl.to(mobileBallRef.current, { top: "450px", duration: 1.5 });
            tl.fromTo(mTabletCardRef.current, { x: -5, opacity: 0.8 }, { x: 0, opacity: 1, duration: 0.4 }, ">-0.2");
            tl.to(mobileBallRef.current, { top: "820px", duration: 1.5 });
            tl.fromTo(mLaptopRowRef.current, { backgroundColor: "transparent" }, { backgroundColor: "rgba(217, 119, 87, 0.08)", duration: 0.3, yoyo: true, repeat: 1 }, ">-0.3");
            tl.to({}, { duration: 0.8 });
            tl.to([mPhoneAlertRef.current, mobileBallRef.current], { opacity: 0, duration: 0.5 });
        });

        return () => mm.revert();
    }, []);

    return (
        <section ref={containerRef} className="py-24 md:py-32 bg-[#1C1917] text-[#FAFAF9] overflow-hidden relative border-t border-white/5">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#D97757]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-24 max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6">One continuous workflow.</h2>
                    <p className="text-lg md:text-xl text-[#A8A29E] font-light max-w-2xl mx-auto leading-relaxed">
                        Data flows seamlessly across your entire team in real-time, from scan to dashboard.
                    </p>
                </div>

                {/* --- DESKTOP STAGE --- */}
                <div className="relative w-full max-w-[1100px] mx-auto hidden lg:flex items-center justify-between h-[420px]">
                    <div className="absolute top-1/2 left-[13%] right-[13%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2"></div>
                    <div ref={ballRef} className="absolute top-1/2 w-4 h-4 bg-[#D97757] rounded-full -translate-y-1/2 opacity-0 z-50 shadow-[0_0_15px_#D97757] border border-white/50" style={{ left: '13%' }}></div>

                    {/* Desktop Phone Mockup */}
                    <div className="relative w-[220px] h-[380px] bg-[#27272A] rounded-[2rem] border-[6px] border-[#3F3F46] shadow-2xl overflow-hidden">
                        {/* Removed pt-8 and added flex centering */}
                        <div className="bg-[#F5F5F4] h-full flex items-center justify-center px-5 relative">
                            <div ref={phoneAlertRef} className="w-full bg-white/70 backdrop-blur-md border border-white shadow-sm p-5 rounded-2xl text-center opacity-0">
                                <div className="w-12 h-12 bg-[#D97757] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#D97757]/20">
                                    <ScanLine size={24} className="text-white" />
                                </div>
                                <div className="text-xs tracking-widest text-[#71717A] font-bold uppercase mb-1">Status</div>
                                <div className="text-sm text-[#18181B] font-medium">Item Scanned</div>
                            </div>
                        </div>
                    </div>
                    {/* Tablet */}
                    <div className="relative w-[340px] h-[260px] bg-[#27272A] rounded-[2rem] border-[6px] border-[#3F3F46] shadow-2xl overflow-hidden">
                        <div className="flex-1 bg-[#F5F5F4] h-full p-6">
                            <div className="flex justify-between items-center mb-6 opacity-40">
                                <div className="h-2 w-20 bg-black/10 rounded-full"></div>
                                <Wifi size={16} className="text-black" />
                            </div>
                            <div ref={tabletCardRef} className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-white shadow-sm">
                                <div className="text-[10px] text-[#A1A1AA] uppercase font-bold tracking-wider mb-2">Inventory Sync</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-serif text-[#18181B]">151</span>
                                    <span className="text-[#D97757] text-sm font-bold">+1</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monitor */}
                    <div className="relative w-[400px] flex flex-col items-center">
                        <div className="w-full h-[280px] bg-[#27272A] rounded-xl border-[6px] border-[#3F3F46] shadow-2xl p-1">
                            <div className="bg-[#F5F5F4] h-full w-full rounded-lg overflow-hidden flex flex-col">
                                <div className="h-10 bg-white/50 border-b border-black/5 flex items-center px-4 gap-2">
                                    <div className="w-2 h-2 rounded-full bg-black/10"></div>
                                    <div className="w-2 h-2 rounded-full bg-black/10"></div>
                                    <div className="flex-1"></div>
                                    <div className="w-16 h-2 bg-black/5 rounded-full"></div>
                                </div>
                                <div className="p-5">
                                    <div ref={laptopRowRef} className="h-14 w-full rounded-xl border border-white bg-white/40 flex items-center px-5 shadow-sm transition-all duration-300">
                                        <div className="w-6 h-6 rounded-full bg-[#D97757] flex items-center justify-center shadow-md">
                                            <span className="text-[10px] text-white font-bold">✓</span>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-xs text-[#18181B] font-bold">Activity Log</div>
                                            <div className="text-[10px] text-[#A1A1AA]">Database entry synced</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-20 h-5 bg-[#3F3F46]"></div>
                        <div className="w-36 h-2 bg-[#52525B] rounded-full shadow-lg"></div>
                    </div>
                </div>

                {/* --- MOBILE STAGE --- */}
                <div className="lg:hidden flex flex-col items-center relative py-12">
                    <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/10 -translate-x-1/2"></div>
                    <div ref={mobileBallRef} className="absolute left-1/2 w-4 h-4 bg-[#D97757] rounded-full -translate-x-1/2 z-50 shadow-[0_0_15px_#D97757] border border-white/40"></div>

                    {/* Mobile Phone */}
                    <div className="relative z-10 mb-16">
                        <div className="w-[200px] h-[340px] bg-[#27272A] rounded-[2rem] border-[5px] border-[#3F3F46] shadow-xl overflow-hidden">
                            <div className="bg-[#F5F5F4] h-full pt-12 px-8">
                                <div ref={mPhoneAlertRef} className="bg-white/80 backdrop-blur-md border border-white p-4 rounded-2xl text-center shadow-lg">
                                    <ScanLine size={20} className="text-[#D97757] mx-auto mb-2" />
                                    <div className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest">Scanned</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ArrowDown className="text-white/10 mb-16" />

                    {/* Tablet */}
                    <div className="relative z-10 mb-16">
                        <div className="w-[280px] h-[200px] bg-[#27272A] rounded-[2rem] border-[5px] border-[#3F3F46] shadow-xl overflow-hidden">
                            <div className="bg-[#F5F5F4] h-full p-5">
                                <div ref={mTabletCardRef} className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-white shadow-sm mt-4">
                                    <div className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest mb-1">Stock Level</div>
                                    <div className="text-2xl font-serif text-[#18181B]">1,241 <span className="text-[#D97757] text-sm">+1</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ArrowDown className="text-white/10 mb-16" />

                    {/* 2. MONITOR - Squashed Checkmark Fix */}
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-[320px] h-[220px] bg-[#27272A] rounded-xl border-[5px] border-[#3F3F46] shadow-xl overflow-hidden p-1">
                            <div className="bg-[#F5F5F4] h-full rounded-lg flex flex-col">
                                <div className="h-8 bg-white/50 border-b border-black/5 flex items-center px-3 gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-black/10"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-black/10"></div>
                                </div>
                                <div className="p-4 flex-1 flex items-center"> {/* Added flex centering here too */}
                                    <div ref={mLaptopRowRef} className="h-14 w-full rounded-xl border border-white bg-white/40 flex items-center px-4 shadow-sm transition-all duration-300">
                                        {/* Added flex-shrink-0 to prevent squashing */}
                                        <div className="w-6 h-6 rounded-full bg-[#D97757] flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <span className="text-[10px] text-white leading-none">✓</span>
                                        </div>
                                        <div className="ml-3 overflow-hidden">
                                            <div className="text-[10px] text-[#18181B] font-bold uppercase tracking-tighter truncate">Database Synced</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-12 h-4 bg-[#3F3F46]"></div>
                        <div className="w-24 h-1.5 bg-[#52525B] rounded-full"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}