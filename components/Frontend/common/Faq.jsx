'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Do we need to buy special barcode scanners?",
    answer: "Not at all. Food Arca is completely web-based and utilizes the camera on any smartphone, tablet, or laptop. You can start scanning instantly without purchasing any expensive proprietary hardware."
  },
  {
    question: "How does the Free Tier work?",
    answer: "Our free tier allows you to manage up to 50 items in your inventory at any given time. It is completely free forever and is designed to help small, single-site pantries move away from spreadsheets without any financial risk."
  },
  {
    question: "Can multiple volunteers use the app at the same time?",
    answer: "Yes! Our Regional and Enterprise plans support real-time collaboration. If one volunteer updates a stock level on their phone, it instantly updates on everyone else's screen. No more double-counting or overlapping work."
  },
  {
    question: "Is our client distribution data secure?",
    answer: "Absolutely. We use enterprise-grade encryption to protect all organization and client data. We only store what is strictly necessary for your operations, ensuring you stay compliant with privacy standards."
  },
  {
    question: "What if we have multiple distribution locations?",
    answer: "For larger networks, our Enterprise tier includes multi-site routing and ITSM capabilities. You can manage a centralized warehouse and track transfers to individual neighborhood distribution sites all within the same dashboard."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0); 

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 lg:py-32 bg-[#FAFAF9] border-t border-[#E7E5E4] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-[85rem]">
        
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          {/* --- LEFT COLUMN: Header & Context --- */}
          <div className="w-full lg:w-[40%] flex flex-col items-start text-left z-10">
            
            {/* Perfectly matched Hierarchy and SVG Swoop */}
            <h2 
              className="stagger-animate opacity-0 text-4xl sm:text-5xl lg:text-6xl font-serif text-[#1C1917] leading-[1.15] lg:leading-[1.1] tracking-tight mb-8 w-full"
              style={{ animationDelay: '0s', willChange: 'transform, opacity, filter' }}
            >
              Frequently asked <br className="hidden sm:block" />
              <span className="relative inline-block z-10">questions
                  <svg className="absolute -bottom-2 -left-1 w-[105%] h-5 -z-10 text-[#D97757]/40" viewBox="0 0 120 15" preserveAspectRatio="none">
                      <path d="M2.38 10.37C17.2 9.08 32.06 7.6 46.91 6.38C53.95 5.8 61 5.31 68.04 4.89C76.99 4.36 85.94 3.93 94.89 3.59C96.34 3.53 97.79 3.48 99.24 3.44C100.28 3.41 101.32 3.39 102.36 3.37M11.66 12.01C25.4 10.99 39.15 9.87 52.88 8.87C62.96 8.14 73.04 7.52 83.12 7C91.95 6.55 100.77 6.19 109.6 5.92C110.83 5.88 112.06 5.85 113.29 5.82C114.36 5.8 115.42 5.77 116.49 5.76" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
              </span>.
            </h2>
            
            <p 
              className="stagger-animate opacity-0 text-[17px] text-[#57534E] font-inter font-light max-w-md leading-relaxed mb-8"
              style={{ animationDelay: '0.1s', willChange: 'transform, opacity, filter' }}
            >
              Everything you need to know about getting your food bank set up, managing inventory, and speeding up your distribution lines.
            </p>
            
            {/* Optional Contact Nudge
            <div 
              className="stagger-animate opacity-0 p-6 bg-white border border-[#E7E5E4] rounded-2xl shadow-sm w-full max-w-sm"
              style={{ animationDelay: '0.2s', willChange: 'transform, opacity, filter' }}
            >
              <h4 className="text-[15px] font-semibold text-[#1C1917] mb-2">Still have questions?</h4>
              <p className="text-sm text-[#78716C] mb-4 leading-relaxed">
                Our team is ready to help you figure out the best setup for your organization's specific needs.
              </p>
              <a href="#contact" className="text-sm font-semibold text-[#D97757] hover:text-[#c6654a] transition-colors flex items-center gap-1">
                Contact support &rarr;
              </a>
            </div> */}
            
          </div>

          {/* --- RIGHT COLUMN: The Accordion --- */}
          <div 
            className="stagger-animate opacity-0 w-full lg:w-[60%] flex flex-col"
            style={{ animationDelay: '0.3s', willChange: 'transform, opacity, filter' }}
          >
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div 
                  key={index} 
                  className={`border-b border-[#E7E5E4] transition-colors duration-300 ${isOpen ? 'bg-white/50' : 'hover:bg-black/[0.02]'}`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between py-6 text-left focus:outline-none px-4 sm:px-6"
                  >
                    <span className={`text-lg sm:text-[19px] font-medium pr-8 transition-colors duration-300 ${isOpen ? 'text-[#D97757]' : 'text-[#1C1917]'}`}>
                      {faq.question}
                    </span>
                    
                    <div className={`shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180 text-[#D97757]' : 'rotate-0 text-[#A8A29E]'}`}>
                      <ChevronDown size={24} strokeWidth={2} />
                    </div>
                  </button>

                  <div 
                    className={`grid transition-all duration-300 ease-in-out px-4 sm:px-6 ${
                      isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0 pb-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-[16px] sm:text-[17px] text-[#57534E] leading-relaxed font-light pr-4 sm:pr-12">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}