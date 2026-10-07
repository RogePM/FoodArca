'use client';

import React, { useState } from 'react';
import CTAActions from './CTAActions';
import AnimatedImageGrid from './AnimatedImageGrid';

// Limits quoted here come from lib/plans.js: free is 150 items and 1 user, Basic and Pro
// add team members (5 and 10) and more items, Enterprise is unlimited across sites.
const TIERS = [
  {
    id: 'small',
    label: 'Small Pantry',
    title: 'Perfect for single-site local operations.',
    description: 'Try it free and track up to 150 items. Take food in and give it out without the usual spreadsheet chaos.',
  },
  {
    id: 'medium',
    label: 'Regional & Medium',
    title: 'Built for growing and collaborative teams.',
    description: 'Paid plans let you invite your team, up to 10 users, and track thousands of items. Everyone works at once and stays in sync in real time.',
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    title: 'Tailored to complex, multi-site networks.',
    description: 'Unlimited team members and locations. Manage inventory across multiple facilities in one place, in real time.',
  },
];

export default function TrustPricingSection() {
  const [activeTab, setActiveTab] = useState('small');

  return (
    // Same cream as the hero and intro, so the page returns to its resting colour after the grey feature section.
    <section className="bg-[#FCFAF7] pt-24 pb-12 sm:pt-28 sm:pb-12 lg:pt-32 lg:pb-12 overflow-x-clip">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">

        {/* --- Header: same shape as the intro and feature sections --- */}
        <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16 lg:mb-20">
          <h2
            className="stagger-animate opacity-0 text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl"
            style={{ willChange: 'transform, opacity, filter' }}
          >
            The inventory system food banks deserve
          </h2>
          <p
            className="stagger-animate opacity-0 mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed"
            style={{ animationDelay: '0.15s', willChange: 'transform, opacity, filter' }}
          >
            From a single pantry to a network of sites, Food Arca grows with you. Try it free and be up and running in minutes.
          </p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* --- Photos --- */}
          <div
            className="stagger-animate opacity-0 order-2 flex w-full justify-center lg:order-1 lg:justify-start"
            style={{ animationDelay: '0.2s', willChange: 'transform, opacity, filter' }}
          >
            <div className="w-full max-w-[560px]">
              <AnimatedImageGrid active={TIERS.findIndex((t) => t.id === activeTab)} />
            </div>
          </div>

          {/* --- Who it fits: stacked rows. The open row carries its own buttons, so they read as part of it --- */}
          <div className="order-1 flex w-full flex-col justify-center text-left lg:order-2 lg:self-stretch">
            <div
              role="tablist"
              aria-orientation="vertical"
              className="stagger-animate opacity-0 flex w-full flex-col"
              style={{ animationDelay: '0.25s', willChange: 'transform, opacity, filter' }}
            >
              {TIERS.map((tier) => {
                const isActive = activeTab === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`border-l-2 pl-6 transition-colors duration-300 ${
                      isActive ? 'border-hero-main' : 'border-[#E7E5E4] hover:border-[#D6D3D1]'
                    }`}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tier.id)}
                      className={`block w-full py-4 text-left font-serif leading-tight outline-none transition-all duration-300 focus-visible:underline ${
                        isActive ? 'pb-0 text-[1.65rem] text-hero-main sm:text-[1.9rem]' : 'text-xl text-hero-muted/60 hover:text-hero-main sm:text-[1.35rem]'
                      }`}
                    >
                      {tier.label}
                    </button>
                    <div
                      className={`grid transition-all duration-500 ease-out ${
                        isActive ? 'grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="mt-3 text-[17px] font-medium leading-snug text-hero-main">{tier.title}</p>
                        <p className="mt-2 max-w-xl text-base font-light leading-relaxed text-hero-muted sm:text-[17px]">
                          {tier.description}
                        </p>
                        <div className="pb-5 pt-6">
                          <CTAActions />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
