'use client';

import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

// Limits quoted here come from lib/plans.js: free is 150 items and 1 user, Basic and Pro
// add team members (5 and 10), Enterprise is unlimited across sites.
const faqs = [
  {
    question: 'Do we need to buy special barcode scanners?',
    answer:
      'Not at all. Food Arca is completely web-based and uses the camera on any smartphone, tablet or laptop. You can start scanning right away without buying any hardware.',
  },
  {
    question: 'How does the free plan work?',
    answer:
      'The free plan lets you track up to 150 items for one user. It is designed to help a small, single-site pantry move away from spreadsheets without any financial risk.',
  },
  {
    question: 'Can multiple volunteers use the app at the same time?',
    answer:
      'Yes. Paid plans let you invite your team, and everyone works at once. If one volunteer updates a stock level on their phone, it updates on everyone else’s screen right away, so no more double-counting.',
  },
  {
    question: 'Is our organization and inventory data secure?',
    answer:
      'Your organization’s data belongs to your team. We only store what your operations need, so you can keep food bank records without handing over more than you have to.',
  },
  {
    question: 'What if we have multiple distribution locations?',
    answer:
      'The Enterprise plan supports unlimited locations and team members, so you can manage every site from the same dashboard.',
  },
];

// Sits directly under the "who it's for" section on the same cream, so the two read as one
// long section: a centred heading, then a narrow column of plain rows split by hairlines.
export default function FAQSection({
  items = faqs,
  heading = 'Frequently asked questions',
  // Space above the heading. The default is the large gap used under the "who it's for" section.
  className = 'pt-28 sm:pt-36 lg:pt-48',
}) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={`bg-[#FCFAF7] pb-28 lg:pb-40 overflow-x-clip ${className}`}>
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">

        {/* --- Header: same shape as the sections above --- */}
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16 lg:mb-20">
          <h2
            className="stagger-animate opacity-0 text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl"
            style={{ willChange: 'transform, opacity, filter' }}
          >
            {heading}
          </h2>
        </div>

        {/* --- Rows --- */}
        <div
          className="stagger-animate opacity-0 mx-auto w-full max-w-3xl border-t border-[#E7E5E4]"
          style={{ animationDelay: '0.15s', willChange: 'transform, opacity, filter' }}
        >
          {items.map((faq, index) => {
            const isOpen = openIndex === index;
            const Icon = isOpen ? Minus : Plus;

            return (
              <div key={faq.question} className="border-b border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-8 py-7 text-left outline-none focus-visible:underline sm:py-8"
                >
                  <span className="font-serif text-[1.15rem] leading-snug text-hero-main sm:text-[1.3rem]">
                    {faq.question}
                  </span>
                  <Icon size={20} strokeWidth={1.5} className="shrink-0 text-hero-muted" />
                </button>

                <div
                  className={`grid transition-all duration-500 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[92%] pb-8 text-base font-light leading-[1.75] text-hero-muted sm:pb-9 sm:text-[17px]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
