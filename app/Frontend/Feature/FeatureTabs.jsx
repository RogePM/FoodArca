'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState(0);
  
  // PERFORMANCE FIX: Track which tabs have been loaded. 
  // We initialize it with [0] so only the first image is sent to the browser on load.
  const [mountedTabs, setMountedTabs] = useState([0]);

  // Data for the interactive tabs
  const features = [
    {
      id: 0,
      title: 'Share team inboxes',
      description: 'Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.',
      image: '/mock/scan.png', 
      link: '/', 
    },
    {
      id: 1,
      title: 'Deliver instant answers',
      description: 'An all-in-one customer service platform that helps you balance everything your customers need to be happy.',
      image: '/mock/noti1.png', 
      link: '/', 
    },
    {
      id: 2,
      title: 'Manage your team with reports',
      description: 'Measure what matters with Food Arca’s easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.',
      image: '/mock/grants.png', 
      link: '/', 
    }
  ];

  const handleTabClick = (index) => {
    // If the image hasn't been mounted to the DOM yet, add it
    if (!mountedTabs.includes(index)) {
      setMountedTabs((prev) => [...prev, index]);
    }
    setActiveTab(index);
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-[600px]">
      
      {/* Left Column: Interactive List */}
      <div className="w-full lg:w-1/2 flex flex-col gap-4 z-10 pb-12 lg:pb-0 lg:pr-12">
        {features.map((feature, index) => {
          const isActive = activeTab === index;
          
          return (
            <div 
              key={feature.id}
              onClick={() => handleTabClick(index)}
              className={`py-3 pl-6 border-l-[6px] transition-all duration-300 cursor-pointer ${
                isActive ? 'border-[#D97757] bg-white/50 rounded-r-xl' : 'border-[#E7E5E4]/60 hover:border-[#D6D3D1]'
              }`}
            >
              <h3 className={`text-xl transition-colors ${
                isActive ? 'font-bold text-[#1C1917]' : 'font-semibold text-[#1C1917]/80'
              }`}>
                {feature.title}
              </h3>
              
              <p className="text-[#57534E] font-light leading-relaxed mb-2">
                {feature.description}
              </p>
              
              <div className={`grid transition-all duration-300 ease-in-out ${
                isActive ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'
              }`}>
                <div className="overflow-hidden">
                  <a href={feature.link} className="inline-flex items-center gap-2 text-[#B95B3E] font-semibold text-[15px] hover:text-[#9A4A30] transition-colors">
                    Learn more <ArrowRight size={18} className="ml-1" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Column: TRUE BLEED AREA */}
      <div className="relative lg:absolute lg:left-1/2 lg:top-0 lg:w-[50vw] h-[350px] sm:h-[450px] lg:h-full flex items-center overflow-hidden z-10">
        
        {/* --- Subtle Angled Background Graphics --- */}
        <div className="absolute top-[30%] -left-[10%] w-[120%] h-[50%] bg-[#D97757]/10 -skew-y-6 -z-10 transform origin-top-left rounded-3xl" />
     
        <div className="relative w-full h-full">
          {features.map((feature, index) => {
            // PERFORMANCE FIX: If the tab has never been clicked, return null. 
            // This prevents the image from entering the DOM or downloading early.
            if (!mountedTabs.includes(index)) return null;

            return (
              <div 
                key={feature.id}
                className={`absolute inset-0 transition-all duration-500 ease-in-out origin-center lg:origin-left ${
                  activeTab === index 
                    ? 'opacity-100 scale-100 z-10' 
                    : 'opacity-0 scale-95 z-0 pointer-events-none'
                }`}
              >
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-contain object-center scale-[1.15] lg:scale-100 lg:object-cover lg:object-left"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  // Only priority load the very first image to crush that LCP score
                  priority={index === 0} 
                />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}