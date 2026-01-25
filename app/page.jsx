'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // <--- Next.js Image Optimization
import {
  Menu, X, Check, ArrowRight, Leaf,
  Users, Timer, ScanBarcode, RefreshCw, Smartphone,
  LockIcon, Package2Icon, UserCircle, ArrowUp,
  Mail, MapPin, AlertCircle, FileText, XCircle, ShieldCheck, Layout, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import NavBar from '@/app/frontNav/NavBar'; // Adjust path if your folder is different
import DevicesSection from '@/app/Frontend/DevicesSection';
import { PLANS } from '@/lib/plans'; // <--- Import this


// --- Animation Imports ---
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

// --- Icon Components ---
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.65-3.657-11.303-8.354l-6.571,4.819C9.656,39.663,16.318,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.23-2.22,4.143-4.162,5.571l6.19,5.238C42.012,35.319,44,30.02,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);
// Helper to format numbers (e.g. 1000 -> 1,000)
const fmt = (n) => n.toLocaleString();


export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQIndex, setOpenFAQIndex] = useState(0);

  // State for Inventory Tabs
  const [activeInventoryTab, setActiveInventoryTab] = useState(0);

  const mainRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fallback for env variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    checkUser();
  }, [supabase, router]);

  // --- ANIMATIONS ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Lenis Setup (Smooth Scroll)
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    let ctx;
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {

        // --- A. HERO SECTION (Kept the same, this was fine) ---
        const heroTextElements = gsap.utils.toArray('.hero-reveal');
        heroTextElements.forEach((el, i) => {
          gsap.fromTo(el,
            { y: 50, opacity: 0, clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' },
            {
              y: 0, opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
              duration: 1, delay: 0.2 + (i * 0.15), ease: "power3.out"
            }
          );
        });

        gsap.from('.hero-widget', {
          y: 40, opacity: 0, duration: 1, delay: 0.8, ease: "power3.out"
        });

        gsap.to(".hero-img-inner", {
          yPercent: 15, ease: "none",
          scrollTrigger: {
            trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true
          }
        });

        // --- B. INVENTORY (Made snappier) ---
        const inventoryItems = gsap.utils.toArray('.inventory-item');
        gsap.fromTo(inventoryItems,
          { opacity: 0, x: 20 }, // Reduced distance from 30 to 20
          {
            opacity: 1, x: 0,
            duration: 0.6, // Faster duration (was 0.8)
            stagger: 0.1,  // Faster stagger (was 0.2)
            ease: "power3.out",
            scrollTrigger: { trigger: "#inventory", start: "top 85%" } // Triggers sooner
          }
        );

        // --- C. PARALLAX (Kept, but optimized start point) ---
        const parallaxImages = gsap.utils.toArray('.parallax-wrapper');
        parallaxImages.forEach((image, i) => {
          const rotateDir = i % 2 === 0 ? 1 : -1;
          gsap.fromTo(image,
            { y: 100, scale: 0.9, rotation: -5 * rotateDir },
            {
              y: -100, scale: 1.1, rotation: 5 * rotateDir, ease: "none",
              scrollTrigger: {
                trigger: image.parentElement,
                start: "top bottom", end: "bottom top", scrub: true
              }
            }
          );
        });

        // --- D. PRICING CARDS (Fixed the delay glitch) ---
        const pricingCards = gsap.utils.toArray('.pricing-card');
        pricingCards.forEach((card, index) => {
          gsap.fromTo(card,
            { opacity: 0, y: 40 }, // Reduced Y distance so it travels less
            {
              opacity: 1, y: 0,
              duration: 0.6, // Faster duration (was 0.8)
              ease: "back.out(1.1)", // Slightly less bounce to feel more professional
              scrollTrigger: {
                trigger: "#pricing-cards",
                start: "top 85%" // Triggers much earlier (was 75%)
              },
              delay: index * 0.1 // Reduced delay between cards
            }
          );
        });

        // --- F. DEVICES SECTION / FADE UP (The Critical Fix) ---
        // 1. Changed duration to 0.7s (was 1s)
        // 2. Changed start to "top 90%" (triggers almost immediately when in view)
        // 3. REMOVED 'reverse' from toggleActions. Once it loads, it stays. 
        //    This fixes the "glitch" where scrolling up makes it vanish.
        const fadeElements = gsap.utils.toArray('.fade-in-up');
        fadeElements.forEach((el) => {
          gsap.fromTo(el,
            { opacity: 0, y: 40 },
            {
              opacity: 1, y: 0,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%", // Starts animating as soon as it enters the viewport
                toggleActions: "play none none none" // PLAY ONCE. Do not reverse.
              }
            }
          );
        });

        // --- E. BACKGROUND PULSE ---
        gsap.to(".absolute.blur-3xl", {
          scale: 1.1, opacity: 0.8, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut",
          stagger: { amount: 2, from: "random" }
        });

      }, mainRef);
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      lenis.destroy();
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const toggleFAQ = (index) => setOpenFAQIndex(openFAQIndex === index ? null : index);

  // --- DATA ---
  // --- UPDATED DATA FOR INVENTORY SECTION ---
  // --- UPDATED DATA FOR INVENTORY SECTION (Concise) ---
  const inventoryTabs = [
    {
      title: "Scan & Cache",
      desc: "Scan a barcode once to define it. Food Arca remembers it forever, auto-filling name and category instantly the next time you scan.",
      icon: ScanBarcode,
      image: "/BarcodeImage.png"
    },
    {
      title: "Rapid Stocking",
      desc: "Set quantity and expiration dates in seconds. No complex forms—just scan, tap the details, and hit save.",
      icon: Package2Icon,
      image: "/AddItemPage.png"
    },
    {
      title: "Instant Team Sync",
      desc: "One click updates every device. Volunteers at the front see new stock available the moment it hits the shelf in the back.",
      icon: RefreshCw,
      image: "/LaptopMock.png"
    }
  ];

  const faqs = [
    { question: 'Is the platform secure for client data?', answer: 'Yes. We adhere to strict privacy standards and use bank-level encryption. You can also choose to track clients anonymously if preferred.' },
    { question: 'Can I export my data?', answer: 'Absolutely. Pro and Enterprise plans offer one-click exports to CSV and Excel files for grant reporting.' },
    { question: 'Do I need to install an app?', answer: 'No installation required. Food Arca is a web-based platform that works instantly on any phone, tablet, or computer with a browser.' },
    { question: 'Are there limits to inventory items?', answer: 'Yes. The Free Pilot handles 50 items. Basic handles 150 items. Pro handles 5,000+ items.' },
  ];

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.querySelector(id);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  return (
    <div ref={mainRef} className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans selection:bg-[#D97757] selection:text-white overflow-x-hidden">

      {/* --- Navigation --- */}
      <NavBar />

      {/* --- Hero Section --- */}
      <main className="hero-section min-h-screen pt-32 pb-20 lg:pt-40 lg:pb-32 px-6 flex flex-col justify-center overflow-hidden">
        <div className="container mx-auto max-w-7xl relative">

          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D97757]/5 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-200/10 rounded-full blur-3xl -z-10"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-24 items-center">
            <div className="hero-content max-w-xl mx-auto w-full z-10">
              <div className="overflow-hidden mb-2">
                <h1 className="hero-reveal text-5xl md:text-6xl lg:text-8xl font-serif leading-[0.95] tracking-tight text-[#1C1917] text-center md:text-left">
                  Feed More.
                </h1>
              </div>
              <div className="overflow-hidden mb-6">
                <h1 className="hero-reveal text-5xl md:text-6xl lg:text-8xl font-serif leading-[0.95] tracking-tight text-center md:text-left">
                  <span className="italic opacity-90 text-[#D97757]">Count Less.</span>
                </h1>
              </div>
              <div className="overflow-hidden mb-12">
                <p className="hero-reveal text-xl text-[#57534E] font-light tracking-wide text-center md:text-left">
                  The inventory tool for high-volume food pantries. Scan barcodes, sync teams in real-time, and speed up your distribution lines.
                </p>
              </div>

              <div className="hero-widget bg-white/80 backdrop-blur-sm border border-[#E7E5E4] p-8 rounded-3xl w-full shadow-2xl shadow-[#D6D3D1]/30">
                <button onClick={handleSignIn} className="w-full bg-white hover:bg-[#F5F5F4] text-[#1C1917] font-medium py-3.5 rounded-xl border border-[#E7E5E4] flex items-center justify-center gap-3 transition-all mb-4 group">
                  <div className="group-hover:scale-110 transition-transform duration-300"><GoogleIcon /></div>
                  Sign Up With Google
                </button>
                <div className="flex items-center gap-4 my-4">
                  <div className="h-px bg-[#E7E5E4] flex-1"></div>
                  <span className="text-sm text-[#A8A29E] uppercase tracking-wide">or</span>
                  <div className="h-px bg-[#E7E5E4] flex-1"></div>
                </div>
                <button onClick={handleSignIn} className="w-full bg-[#1C1917] hover:bg-[#34302e] text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                  <LockIcon size={20} />
                  Sign In
                </button>
              </div>
            </div>

            <div className="hero-image hidden md:block relative w-full h-full min-h-[450px] lg:min-h-[600px] bg-[#D97757] rounded-[2.5rem] shadow-2xl shadow-[#D6D3D1]/50 p-4 lg:p-6">
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-lg z-10 bg-black">
                <Image
                  src="/HeroArca2.png"
                  alt="Food Arca Dashboard"
                  fill
                  className="hero-img-inner object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* --- SECTION 2: INVENTORY (Concise Copy & Animated) --- */}
      {/* --- SECTION 2: INVENTORY (Concise Copy & Animated) --- */}
      <section id="inventory" className="fade-section min-h-screen py-24 bg-[#F5F5F4] flex flex-col justify-center scroll-mt-20">
        <div className="container mx-auto px-6">

          {/* --- 1. HEADER --- */}
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif text-[#1C1917] mb-6">
              Add inventory in seconds.
            </h2>
            <p className="text-xl text-[#57534E] font-light">
              Scan a barcode once. The system remembers it forever. No more manual typing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* --- 2. LEFT COLUMN: IMPROVED DYNAMIC IMAGES --- */}
            <div id="inventory-image-container" className="lg:col-span-5 relative group order-2 lg:order-1">
              {/* Ambient Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#D97757]/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

              <div className="relative bg-white rounded-[2.5rem] p-3 shadow-2xl shadow-[#D6D3D1]/50 overflow-hidden h-[500px] border border-[#E7E5E4]">
                <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                  {inventoryTabs.map((tab, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${activeInventoryTab === index
                          ? 'opacity-100 scale-100 translate-y-0 z-10'
                          : 'opacity-0 scale-105 translate-y-4 z-0'
                        }`}
                    >
                      <Image
                        src={tab.image}
                        alt={tab.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        priority={index === 0}
                      />
                      {/* Subtle Overlay for depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/20 to-transparent" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* --- 3. RIGHT COLUMN: ACCORDION TABS --- */}
            <div className="lg:col-span-7 flex flex-col justify-center h-full order-1 lg:order-2">
              <div className="space-y-2">
                {inventoryTabs.map((tab, index) => (
                  <div
                    key={index}
                    className={`inventory-item group rounded-3xl transition-all duration-300 border ${activeInventoryTab === index
                        ? 'bg-white shadow-xl shadow-[#D6D3D1]/30 border-[#E7E5E4]'
                        : 'bg-transparent border-transparent hover:bg-white/40'
                      }`}
                  >
                    <button
                      onClick={() => setActiveInventoryTab(index)}
                      className="w-full flex items-start gap-6 p-6 text-left focus:outline-none"
                    >
                      {/* Icon Box */}
                      <div className={`shrink-0 p-3 rounded-2xl transition-all duration-300 ${activeInventoryTab === index
                          ? 'bg-[#D97757] text-white shadow-lg shadow-[#D97757]/20'
                          : 'bg-[#E7E5E4]/50 text-[#A8A29E] group-hover:text-[#D97757]'
                        }`}>
                        <tab.icon size={24} />
                      </div>

                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-xl font-serif transition-colors ${activeInventoryTab === index ? 'text-[#1C1917]' : 'text-[#78716C] group-hover:text-[#1C1917]'
                            }`}>
                            {tab.title}
                          </h3>
                          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${activeInventoryTab === index ? 'rotate-180 text-[#D97757]' : 'text-[#A8A29E]'
                            }`} />
                        </div>

                        {/* Animated Height Description */}
                        <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${activeInventoryTab === index ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'
                          }`}>
                          <div className="overflow-hidden">
                            <p className="text-base font-light leading-relaxed text-[#57534E] pb-2">
                              {tab.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 3: DISTRIBUTION (3-Step Zig-Zag) --- */}
      <section id="distribution" className="fade-section min-h-screen py-24 bg-white border-y border-[#E7E5E4] flex flex-col justify-center scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-serif text-[#1C1917] mb-6">
              Speed up your serving line.
            </h2>
            <p className="text-xl text-[#57534E] font-light max-w-3xl mx-auto">
              Built for the chaotic reality of food distribution. Three steps to a faster pantry.
            </p>
          </div>

          <div className="flex flex-col gap-32">

            {/* STEP 1: SAFETY (Image Left, Text Right) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

              {/* Image Side */}
              <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative">
                {/* Decorative Blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#D97757]/5 rounded-full blur-3xl -z-10"></div>

                <div className="parallax-wrapper relative w-full max-w-[300px] aspect-[9/19] rounded-[2.5rem] shadow-2xl border border-[#E7E5E4] overflow-hidden bg-[#FAFAF9]">
                  <Image src="/PhoneRemoveItemMock.png" alt="Expired Alerts" fill className="object-cover" />
                </div>
              </div>

              {/* Text Side */}
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-[#D97757]/10 text-[#D97757] px-4 py-1.5 rounded-full text-sm font-medium uppercase tracking-wider mb-6">
                  <AlertCircle size={16} /> Step 01
                </div>
                <h3 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-6">
                  Spot Expired Goods <br /><span className="text-[#D97757]">Instantly.</span>
                </h3>
                <p className="text-lg text-[#57534E] font-light leading-relaxed max-w-md mx-auto lg:mx-0">
                  Volunteers move fast. Food Arca moves faster. The app automatically flags expired items with <strong className="text-[#D97757] font-medium">Red Tags</strong> so you never accidentally distribute bad food.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <div className="flex items-center gap-3 justify-center lg:justify-start text-[#57534E]">
                    <Check size={18} className="text-[#D97757]" />
                    <span>Automatic date checking</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center lg:justify-start text-[#57534E]">
                    <Check size={18} className="text-[#D97757]" />
                    <span>Clear visual warnings</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: SCAN (Text Left, Image Right) */}
            <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">

              {/* Text Side - Pushed to Right Edge of Left Column */}
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                {/* Wrapper to align block to the right (spine) on desktop */}
                <div className="max-w-md mx-auto lg:mr-0 lg:ml-auto">

                  <div className="inline-flex items-center gap-2 bg-[#D97757]/10 text-[#D97757] px-4 py-1.5 rounded-full text-sm font-medium uppercase tracking-wider mb-6">
                    <ScanBarcode size={16} /> Step 02
                  </div>

                  <h3 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-6">
                    Build Carts with <br /><span className="text-[#D97757]">One Scan.</span>
                  </h3>

                  <p className="text-lg text-[#57534E] font-light leading-relaxed">
                    Don't waste time searching lists. Use the camera to scan items directly. Our <strong className="text-[#D97757] font-medium">Smart Cache</strong> identifies items instantly.
                  </p>

                  <div className="mt-8 flex flex-col gap-3">
                    <div className="flex items-center gap-3 justify-center lg:justify-start text-[#57534E]">
                      <Check size={18} className="text-[#D97757]" />
                      <span>Instant product recognition</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center lg:justify-start text-[#57534E]">
                      <Check size={18} className="text-[#D97757]" />
                      <span>No manual typing needed</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Image Side - Aligned to Left Edge of Right Column */}
              <div className="w-full lg:w-1/2 flex justify-center lg:justify-start relative">
                {/* Decorative Blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/50 rounded-full blur-3xl -z-10"></div>

                <div className="parallax-wrapper relative w-full max-w-[300px] aspect-[9/19] rounded-[2.5rem] shadow-2xl border border-[#E7E5E4] overflow-hidden bg-[#FAFAF9]">
                  <Image src="/BarcodeScanner.png" alt="Barcode Scanning" fill className="object-cover" />
                </div>
              </div>

            </div>

            {/* STEP 3: CHECKOUT (Image Left, Text Right) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

              {/* Image Side */}
              <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative">
                {/* Decorative Blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#D97757]/5 rounded-full blur-3xl -z-10"></div>

                <div className="parallax-wrapper relative w-full max-w-[300px] aspect-[9/19] rounded-[2.5rem] shadow-2xl border border-[#E7E5E4] overflow-hidden bg-[#FAFAF9]">
                  <Image src="/CartPhone.png" alt="Checkout Cart" fill className="object-cover" />
                </div>
              </div>

              {/* Text Side */}
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-[#D97757]/10 text-[#D97757] px-4 py-1.5 rounded-full text-sm font-medium uppercase tracking-wider mb-6">
                  <Users size={16} /> Step 03
                </div>
                <h3 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-6">
                  Checkout <br /><span className="text-[#D97757]">Your Way.</span>
                </h3>
                <p className="text-lg text-[#57534E] font-light leading-relaxed max-w-md mx-auto lg:mx-0">
                  Every distribution is different. Toggle <strong className="text-[#D97757] font-medium">Anonymous Mode</strong> for fast grab-and-go events, or track client history for detailed grant reporting.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <div className="flex items-center gap-3 justify-center lg:justify-start text-[#57534E]">
                    <Check size={18} className="text-[#D97757]" />
                    <span>Grant-ready reports</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center lg:justify-start text-[#57534E]">
                    <Check size={18} className="text-[#D97757]" />
                    <span>Fast queue processing</span>
                  </div>
                </div>

                {/* Optional Pro Tip kept but styled to match */}
                <div className="mt-8 p-6 bg-[#FAFAF9] rounded-2xl border border-[#E7E5E4] inline-block text-left">
                  <p className="text-sm font-medium text-[#D97757] mb-2">Pro Tip:</p>
                  <p className="text-sm text-[#78716C] italic">"We use Anonymous Mode for our Saturday drive-thrus to keep the line moving!"</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 4: CLIENT DATA (Refined & Responsive) --- */}
      <section id="clients" className="fade-section py-24 bg-[#FAFAF9] scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Image Side (Fixed for Wide Screenshots) */}
            {/* Changed aspect-ratio to [4/3] so wide images fit on mobile */}
            <div className="w-full relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#1C1917]/5 rounded-full blur-3xl -z-10"></div>

              {/* Added 'parallax-wrapper' for animation */}
              {/* Changed aspect-[9/19] to aspect-[4/3] for better mobile view */}
              <div className=" relative w-full aspect-[4/3] lg:aspect-square bg-white rounded-[2rem] shadow-2xl border border-[#E7E5E4] overflow-hidden">
                <Image
                  src="/ClientDirectoryTablet.png"
                  alt="Client Directory"
                  fill
                  className="fade-in-up object-cover object-top"
                />
              </div>
            </div>

            {/* Text Side */}
            <div>
              {/* Uniform Badge Style */}


              <h2 className="text-4xl md:text-5xl font-serif text-[#1C1917] mb-6">
                Track the Impact. <br />
              </h2>

              <p className="text-lg text-[#57534E] font-light leading-relaxed mb-10">
                Stop guessing who you’ve served. Food Arca keeps a secure, searchable history of every distribution while balancing detailed grant reporting with client dignity.
              </p>

              <div className="space-y-6">
                {/* Feature 1 */}
                <div className="flex gap-5">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-white border border-[#E7E5E4] flex items-center justify-center shadow-sm text-[#D97757]">
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-[#1C1917] mb-2">Dignified Data</h4>
                    <p className="text-[#57534E] font-light text-sm leading-relaxed">
                      Keep secure histories for each client or log anonymous 'Walk-ins'—all in one report.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex gap-5">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-white border border-[#E7E5E4] flex items-center justify-center shadow-sm text-[#D97757]">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-[#1C1917] mb-2">Audit-Ready History</h4>
                    <p className="text-[#57534E] font-light text-sm leading-relaxed">
                      See exactly who received 'Sweet Potatoes' or 'Beans' and when. Ensure fair distribution across your community.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 5: DEVICES (The Ecosystem Layout) --- */}
      {/* --- SECTION 5: DEVICES (Bento Grid) --- */}
      <DevicesSection />

      {/* --- SECTION 6: PRICING (Updated Strategy) --- */}
      <section id="pricing" className="min-h-screen py-24 bg-[#FAFAF9] relative overflow-hidden flex flex-col justify-center scroll-mt-20">
        {/* Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D97757]/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-serif text-[#1C1917] mb-6">
              Simple, transparent pricing.
            </h2>
            <p className="text-lg text-[#57534E] max-w-2xl mx-auto font-light">
              Start for free. Upgrade when you're ready to grow.
            </p>
          </div>

          {/* 0. UNIVERSAL FEATURES */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16 text-sm text-[#78716C] font-light">
            <span className="flex items-center gap-2"><Smartphone size={16} /> Mobile Camera Scanning</span>
            <span className="flex items-center gap-2"><RefreshCw size={16} /> Real-Time Sync</span>
            <span className="flex items-center gap-2"><LockIcon size={16} /> Secure Cloud Storage</span>
          </div>

          {/* 1. THE PILOT BANNER (Dynamic) */}
          <div className="pricing-card max-w-4xl mx-auto bg-[#1C1917] rounded-[2rem] p-8 md:p-10 text-white shadow-2xl mb-16 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D97757]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="inline-block bg-[#D97757] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">Free Forever</div>
                <h3 className="text-3xl md:text-4xl font-serif mb-2">Food Arca {PLANS.pilot.name}</h3>
                <p className="text-[#A8A29E] font-light text-lg mb-4">
                  Manage your first {PLANS.pilot.limits.items} items with <span className="text-white font-medium">ALL Pro Features</span>.
                </p>
                <ul className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-[#D6D3D1]">
                  {PLANS.pilot.features.csv_export && (
                    <li className="flex items-center gap-2"><Check size={16} className="text-[#D97757]" /> CSV Exports</li>
                  )}
                  <li className="flex items-center gap-2"><Check size={16} className="text-[#D97757]" /> {PLANS.pilot.limits.users} Team Users</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-[#D97757]" /> Client History</li>
                </ul>
              </div>
              <button onClick={handleSignIn} className="bg-white text-[#1C1917] px-8 py-4 rounded-xl font-medium hover:bg-[#D97757] hover:text-white transition-all shadow-xl hover:scale-105 whitespace-nowrap">
                Start My Pilot
              </button>
            </div>
          </div>

          {/* 2. THE CARDS (Grid) */}
          <div id="pricing-cards" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch mb-24">

            {/* Basic Plan */}
            <div className="pricing-card bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 border border-[#E7E5E4] flex flex-col h-full hover:border-[#D97757] transition-colors">
              <div className="mb-4"><span className="bg-[#E7E5E4] text-[#57534E] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Starter</span></div>
              <h3 className="text-2xl font-serif font-medium mb-2">{PLANS.basic.name}</h3>
              <div className="mb-6"><span className="text-4xl font-serif">${PLANS.basic.price}</span><span className="text-sm text-[#78716C]">/mo</span></div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center gap-3 text-sm text-[#57534E]"><Package2Icon size={16} /> <strong>{fmt(PLANS.basic.limits.items)}</strong> Item Barcodes</div>
                <div className="flex items-center gap-3 text-sm text-[#57534E]"><Users size={16} /> <strong>{PLANS.basic.limits.users}</strong> Users (Admin+1)</div>
                <div className="flex items-center gap-3 text-sm text-[#57534E]"><UserCircle size={16} /> <strong>{fmt(PLANS.basic.limits.clients)}</strong> Family Profiles</div>

                {PLANS.basic.features.csv_export ? (
                  <div className="flex items-center gap-3 text-sm text-[#57534E]"><Check size={16} /> Data Export</div>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-[#A8A29E] line-through decoration-[#D97757]"><XCircle size={16} /> View-Only (No Export)</div>
                )}
              </div>
              <button
                onClick={handleSignIn}
                className="w-full py-3 rounded-xl border border-[#E7E5E4] hover:bg-[#1C1917] hover:text-white transition-all font-medium">Select {PLANS.basic.name}</button>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card bg-white rounded-[2rem] p-8 border-2 border-[#D97757] shadow-xl flex flex-col h-full relative transform md:-translate-y-4 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D97757] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">Most Popular</div>
              <h3 className="text-2xl font-serif font-medium mb-2 mt-2">{PLANS.pro.name}</h3>
              <div className="mb-6"><span className="text-4xl font-serif">${PLANS.pro.price}</span><span className="text-sm text-[#78716C]">/mo</span></div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center gap-3 text-sm font-medium text-[#1C1917]"><Package2Icon size={16} className="text-[#D97757]" /> <strong>{fmt(PLANS.pro.limits.items)}</strong> Item Barcodes</div>
                <div className="flex items-center gap-3 text-sm font-medium text-[#1C1917]"><Users size={16} className="text-[#D97757]" /> <strong>{PLANS.pro.limits.users}</strong> Team Size</div>
                <div className="flex items-center gap-3 text-sm font-medium text-[#1C1917]"><UserCircle size={16} className="text-[#D97757]" /> <strong>{fmt(PLANS.pro.limits.clients)}</strong> Family Profiles</div>
                <div className="flex items-center gap-3 text-sm font-medium text-[#1C1917]"><Check size={16} className="text-[#D97757]" /> One-Click CSV Exports</div>
              </div>
              <button
                onClick={handleSignIn}
                className="w-full py-3 rounded-xl bg-[#D97757] text-white hover:bg-[#C26245] transition-all shadow-lg font-medium">Select {PLANS.pro.name}</button>
            </div>

            {/* Enterprise (Static) */}
            <div className="pricing-card bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 border border-[#E7E5E4] flex flex-col h-full hover:border-[#D97757] transition-colors">
              <div className="mb-4"><span className="bg-[#1C1917] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Network</span></div>
              <h3 className="text-2xl font-serif font-medium mb-2">Enterprise</h3>
              <div className="mb-6"><span className="text-4xl font-serif">Custom</span></div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center gap-3 text-sm text-[#57534E]"><MapPin size={16} /> Multi-Location Sync</div>
                <div className="flex items-center gap-3 text-sm text-[#57534E]"><Layout size={16} /> HQ Admin Dashboard</div>
                <div className="flex items-center gap-3 text-sm text-[#57534E]"><Check size={16} /> Unlimited Capacity</div>
                <div className="flex items-center gap-3 text-sm text-[#57534E]"><Check size={16} /> Dedicated Support</div>
              </div>
              <a
                href="mailto:support@foodarca.com"
                className="w-full block text-center py-3 rounded-xl border border-[#E7E5E4] hover:bg-[#1C1917] hover:text-white transition-all font-medium"
              >
                Contact Sales
              </a>

            </div>

          </div>

          {/* 3. COMPARISON SECTION (Linked to Data) */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-center font-serif text-2xl mb-8 text-[#1C1917]">Feature Comparison</h3>

            {/* --- MOBILE VIEW: Vertical Feature Lists --- */}
            <div className="md:hidden space-y-6">

              {/* Pilot */}
              <div className="bg-white rounded-2xl p-6 border border-[#E7E5E4] shadow-sm">
                <h4 className="font-serif text-lg text-[#1C1917] mb-4 border-b border-[#E7E5E4] pb-2">{PLANS.pilot.name}</h4>
                <div className="space-y-3 text-sm text-[#57534E]">
                  <div className="flex justify-between"><span>Inventory Limit</span> <span className="font-medium">{fmt(PLANS.pilot.limits.items)} Items</span></div>
                  <div className="flex justify-between"><span>Client Profiles</span> <span className="font-medium">{fmt(PLANS.pilot.limits.clients)}</span></div>
                  <div className="flex justify-between"><span>Team Size</span> <span className="font-medium">{PLANS.pilot.limits.users} Users</span></div>
                  <div className="flex justify-between items-center"><span>Data Exports</span> {PLANS.pilot.features.csv_export ? <Check size={16} className="text-[#D97757]" /> : <XCircle size={16} className="text-[#A8A29E]" />}</div>
                </div>
              </div>

              {/* Basic */}
              <div className="bg-white rounded-2xl p-6 border border-[#E7E5E4] shadow-sm">
                <h4 className="font-serif text-lg text-[#1C1917] mb-4 border-b border-[#E7E5E4] pb-2">{PLANS.basic.name}</h4>
                <div className="space-y-3 text-sm text-[#57534E]">
                  <div className="flex justify-between"><span>Inventory Limit</span> <span className="font-medium">{fmt(PLANS.basic.limits.items)} Items</span></div>
                  <div className="flex justify-between"><span>Client Profiles</span> <span className="font-medium">{fmt(PLANS.basic.limits.clients)} Families</span></div>
                  <div className="flex justify-between"><span>Team Size</span> <span className="font-medium">{PLANS.basic.limits.users} Users</span></div>
                  <div className="flex justify-between items-center"><span>Data Exports</span> {PLANS.basic.features.csv_export ? <Check size={16} className="text-[#D97757]" /> : <XCircle size={16} className="text-[#A8A29E]" />}</div>
                </div>
              </div>

              {/* Pro */}
              <div className="bg-[#FAFAF9] rounded-2xl p-6 border-2 border-[#D97757] shadow-md relative">
                <div className="absolute top-0 right-0 bg-[#D97757] text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold uppercase">Best Value</div>
                <h4 className="font-serif text-lg text-[#1C1917] mb-4 border-b border-[#D97757]/20 pb-2">{PLANS.pro.name}</h4>
                <div className="space-y-3 text-sm text-[#57534E]">
                  <div className="flex justify-between"><span>Inventory Limit</span> <span className="font-bold text-[#1C1917]">{fmt(PLANS.pro.limits.items)} Items</span></div>
                  <div className="flex justify-between"><span>Client Profiles</span> <span className="font-bold text-[#1C1917]">{fmt(PLANS.pro.limits.clients)} Families</span></div>
                  <div className="flex justify-between"><span>Team Size</span> <span className="font-bold text-[#1C1917]">{PLANS.pro.limits.users} Users</span></div>
                  <div className="flex justify-between items-center"><span>Data Exports</span> <Check size={16} className="text-[#D97757]" /></div>
                </div>
              </div>
            </div>

            {/* --- DESKTOP VIEW: Comparison Table --- */}
            <div className="hidden md:block overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#E7E5E4]">
                    <th className="py-4 pl-4 font-serif text-lg bg-[#FAFAF9] sticky left-0 z-10">Feature</th>
                    <th className="py-4 px-4 font-medium text-[#78716C]">{PLANS.pilot.name}</th>
                    <th className="py-4 px-4 font-medium text-[#78716C]">{PLANS.basic.name}</th>
                    <th className="py-4 px-4 font-bold text-[#D97757]">{PLANS.pro.name}</th>
                    <th className="py-4 px-4 font-medium text-[#78716C]">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#57534E]">
                  <tr className="border-b border-[#E7E5E4]/50 hover:bg-white/50">
                    <td className="py-4 pl-4 font-medium bg-[#FAFAF9] sticky left-0">Inventory Limit</td>
                    <td className="px-4">{fmt(PLANS.pilot.limits.items)} Items</td>
                    <td className="px-4">{fmt(PLANS.basic.limits.items)} Items</td>
                    <td className="px-4 font-bold text-[#1C1917]">{fmt(PLANS.pro.limits.items)} Items</td>
                    <td className="px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b border-[#E7E5E4]/50 hover:bg-white/50">
                    <td className="py-4 pl-4 font-medium bg-[#FAFAF9] sticky left-0">Client Profiles</td>
                    <td className="px-4">{fmt(PLANS.pilot.limits.clients)} Families</td>
                    <td className="px-4">{fmt(PLANS.basic.limits.clients)} Families</td>
                    <td className="px-4 font-bold text-[#1C1917]">{fmt(PLANS.pro.limits.clients)} Families</td>
                    <td className="px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b border-[#E7E5E4]/50 hover:bg-white/50">
                    <td className="py-4 pl-4 font-medium bg-[#FAFAF9] sticky left-0">Team Size</td>
                    <td className="px-4">{PLANS.pilot.limits.users} Users</td>
                    <td className="px-4">{PLANS.basic.limits.users} Users</td>
                    <td className="px-4 font-bold text-[#1C1917]">{PLANS.pro.limits.users} Users</td>
                    <td className="px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b border-[#E7E5E4]/50 hover:bg-white/50 bg-[#D97757]/5">
                    <td className="py-4 pl-4 font-medium bg-[#FAFAF9] sticky left-0">Data Exports (CSV)</td>
                    <td className="px-4 text-[#D97757]">{PLANS.pilot.features.csv_export ? <Check size={18} /> : <XCircle size={18} className="text-[#A8A29E]" />}</td>
                    <td className="px-4 text-[#D97757]">{PLANS.basic.features.csv_export ? <Check size={18} /> : <XCircle size={18} className="text-[#A8A29E]" />}</td>
                    <td className="px-4 text-[#D97757]"><Check size={18} /></td>
                    <td className="px-4 text-[#D97757]"><Check size={18} /></td>
                  </tr>
                  <tr className="hover:bg-white/50">
                    <td className="py-4 pl-4 font-medium bg-[#FAFAF9] sticky left-0">Multi-Location</td>
                    <td className="px-4 text-[#A8A29E]"><XCircle size={18} /></td>
                    <td className="px-4 text-[#A8A29E]"><XCircle size={18} /></td>
                    <td className="px-4 text-[#A8A29E]"><XCircle size={18} /></td>
                    <td className="px-4 text-[#D97757]"><Check size={18} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </section>

      {/* --- FAQ Section --- */}
      <section id="FAQ" className="py-24 bg-[#F5F5F4] flex flex-col justify-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-serif text-[#1C1917] text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                onClick={() => toggleFAQ(index)}
                className={`group border border-[#E7E5E4] rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-md ${openFAQIndex === index ? 'bg-white shadow-md' : 'bg-transparent'
                  }`}
              >
                <h3 className="text-lg md:text-xl font-medium flex items-center justify-between gap-4 text-[#1C1917]">
                  <span className="flex-1">{faq.question}</span>
                  <div className={`transition-transform duration-300 shrink-0 bg-[#F5F5F4] p-1 rounded-full ${openFAQIndex === index ? 'rotate-180 text-[#D97757]' : 'text-[#A8A29E]'
                    }`}>
                    {openFAQIndex === index ? <X size={20} /> : <ArrowRight size={20} />}
                  </div>
                </h3>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openFAQIndex === index ? 'max-h-96 opacity-100 pt-4' : 'max-h-0 opacity-0'
                  }`}>
                  <p className="text-[#78716C] leading-relaxed text-sm md:text-base">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-[#FAFAF9] border-t border-[#E7E5E4] pt-24 pb-12 relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute -top-24 -right-24 text-[20rem] font-serif text-[#1C1917] opacity-[0.02] pointer-events-none select-none leading-none">
          Arca
        </div>

        <div className="container mx-auto px-6 relative z-10">

          {/* Top CTA Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-20 pb-20 border-b border-[#E7E5E4]">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-4">
                Ready to modernize your pantry?
              </h2>
              <p className="text-[#57534E] font-light text-lg">
                Join hundreds of food banks serving their communities with dignity and speed.
              </p>
            </div>
            <div className="mt-8 md:mt-0">
              <button className="bg-[#1C1917] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#D97757] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                Get Started for Free
              </button>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-24 mb-20">

            {/* Column 1: Brand & Description */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Leaf size={24} className="text-[#D97757]" />
                <span className="text-xl font-serif font-medium tracking-tight text-[#1C1917]">Food Arca</span>
              </div>

              <p className="text-[#78716C] text-sm leading-relaxed mb-6">
                The mobile-first inventory tool for high-volume food pantries. Scan barcodes, sync teams in real-time, and speed up your distribution lines.
              </p>
            </div>

            {/* Column 2: Quick Links (Updated to match NavBar) */}
            <div>
              <h4 className="font-serif text-[#1C1917] mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-4 text-sm text-[#78716C]">
                {['Inventory', 'Distribution', 'Clients', 'Pricing'].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      onClick={(e) => scrollToSection(e, `#${item.toLowerCase()}`)}
                      className="hover:text-[#D97757] transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact & Local SEO */}
            <div>
              <h4 className="font-serif text-[#1C1917] mb-6 text-lg">Contact</h4>
              <ul className="space-y-4 text-sm text-[#78716C] mb-8">
                <li className="flex items-center gap-2">
                  <Mail size={16} className="text-[#D97757] shrink-0" />
                  <a href="mailto:support@foodarca.com" className="hover:text-[#D97757] transition-colors break-all">support@foodarca.com</a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={16} className="text-[#D97757] shrink-0 mt-0.5" />
                  <span>Greensboro, NC, USA</span>
                </li>
              </ul>

              {/* Local Roots Bubbles */}
              <div className="pt-4 border-t border-[#E7E5E4]/60">
                <span className="text-xs font-semibold text-[#D97757] tracking-wider uppercase mb-3 block">
                  Proudly Serving The Triad
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Forsyth County', 'Guilford County', 'Kernersville', 'Winston-Salem'].map((city) => (
                    <span key={city} className="inline-block px-2 py-1 bg-[#E7E5E4]/40 border border-[#E7E5E4] rounded-md text-[10px] font-medium text-[#57534E]">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h4 className="font-serif text-[#1C1917] mb-6 text-lg">Legal</h4>
              <ul className="space-y-4 text-sm text-[#78716C]">
                <li><Link href="/terms" className="hover:text-[#D97757] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#D97757] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-[#E7E5E4] text-xs text-[#A8A29E]">
            <p>&copy; 2025 Food Arca Inc. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span>Designed and made by</span>
              <span className="text-[#1C1917] font-medium">Rogelio Perez</span>
            </div>
          </div>
        </div>
      </footer>

      <button
        onClick={(e) => scrollToSection(e, 'top')}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 ease-out border border-[#E7E5E4] ${showScrollTop
          ? 'opacity-100 translate-y-0 bg-[#1C1917] text-white hover:bg-[#D97757] hover:-translate-y-1'
          : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        aria-label="Scroll to top"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
}