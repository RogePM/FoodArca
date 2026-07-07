'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const [mountedTabs, setMountedTabs] = useState([0]); 
  
  // RESTORED: React needs to manage the animation state for interactive components!
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); 
        }
      },
      { threshold: 0.15 } 
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      id: 0,
      title: 'Barcode Scanning for Speed',
      description: 'Camera barcode scanning makes it easy to intake and distribute food quickly.',
      image: '/mock/scan.png', 
      link: '/', 
    },
    {
      id: 1,
      title: 'Works on Any Device',
      description: 'Web-based, so it works on any device with a camera and internet connection. No more expensive hardware to buy or maintain.',
      image: '/mock/sidemock.png', 
      link: '/', 
    },
    {
      id: 2,
      title: 'Export data for reports',
      description: 'Measure what matters with Food Arca’s easy-to-use reports. You can export, and drilldown on the data in a couple clicks.',
      image: '/mock/grants.png', 
      link: '/', 
    }
  ];

  const handleTabClick = (index) => {
    if (!mountedTabs.includes(index)) {
      setMountedTabs((prev) => [...prev, index]);
    }
    setActiveTab(index);
  };

  return (
    // RESTORED: Attached the sectionRef so the observer knows where to look
    <div ref={sectionRef} className="relative flex flex-col lg:flex-row min-h-[600px] py-12">
      
      {/* --- Left Column: Interactive List --- */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6 z-10 pb-12 lg:pb-0 lg:pr-12">
        {features.map((feature, index) => {
          const isActive = activeTab === index;
          
          return (
            <div 
              key={feature.id}
              onClick={() => handleTabClick(index)}
              className={`py-4 pl-6 border-l-[6px] transition-all duration-300 cursor-pointer ${
                isActive ? 'border-[#D97757] bg-[#D97757]/5 rounded-r-xl' : 'border-[#E7E5E4]/60 hover:border-[#D6D3D1]'
              }`}
            >
              
              {/* CHANGED: Swapped stagger-animate for the React-controlled inView logic */}
              <h3 
                className={`text-xl transition-colors opacity-0 ${
                  isActive ? 'font-bold text-[#1C1917]' : 'font-semibold text-[#1C1917]/80'
                } ${inView ? 'animate-water-wash' : ''}`}
                style={{ animationDelay: `${index * 0.2}s`, willChange: 'transform, opacity, filter' }} 
              >
                {feature.title}
              </h3>
              
              <p 
                className={`text-[#57534E] font-light leading-relaxed mb-3 opacity-0 ${inView ? 'animate-water-wash' : ''}`}
                style={{ animationDelay: `${index * 0.2 + 0.1}s`, willChange: 'transform, opacity, filter' }} 
              >
                {feature.description}
              </p>
              
              <div 
                className={`opacity-0 ${inView ? 'animate-water-wash' : ''}`}
                style={{ animationDelay: `${index * 0.2 + 0.2}s`, willChange: 'transform, opacity, filter' }} 
              >
                <a href={feature.link} className="inline-flex items-center gap-2 text-[#B95B3E] font-semibold text-[15px] hover:text-[#9A4A30] transition-colors">
                  Learn more <ArrowRight size={18} className="ml-1" />
                </a>
              </div>

            </div>
          );
        })}
      </div>

      {/* --- Right Column: TRUE BLEED AREA --- */}
      <div 
        className={`relative lg:absolute lg:left-1/2 lg:top-0 lg:w-[50vw] h-[350px] sm:h-[450px] lg:h-full flex items-center overflow-hidden z-10 opacity-0 ${
          inView ? 'animate-water-wash' : ''
        }`}
        style={{ animationDelay: '0.1s', willChange: 'transform, opacity, filter' }}
      >
        
        <div className="absolute top-[30%] -left-[10%] w-[120%] h-[50%] bg-[#D97757]/10 -skew-y-6 -z-10 transform origin-top-left rounded-3xl" />
      
        <div className="relative w-full h-full">
          {features.map((feature, index) => {
            const isPriority = index === 0;

            if (!mountedTabs.includes(index) && !isPriority) return null;

            return (
              <div 
                key={feature.id}
                className={`absolute inset-0 transition-all duration-500 ease-in-out origin-center lg:origin-left will-change-transform ${
                  activeTab === index 
                    ? 'opacity-100 scale-100 z-10 pointer-events-auto' 
                    : 'opacity-0 scale-95 z-0 pointer-events-none'
                }`}
              >
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-contain object-center scale-[1.15] lg:scale-100 lg:object-cover lg:object-left"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={isPriority} 
                />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}