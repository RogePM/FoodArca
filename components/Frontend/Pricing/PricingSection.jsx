'use client';

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { useAuthAction } from '@/lib/use-auth-action';

// Everything on a plan card comes from lib/plans.js (limits, price, export, multi-site), so the
// page can't drift from what the app enforces. Only wording is typed in here.
const formatLimit = (n) => (n >= 999999 ? 'Unlimited' : n.toLocaleString('en-US'));

const CARDS = [
  { key: 'free', name: 'Free', blurb: 'For a small, single-site pantry moving off spreadsheets.' },
  { key: 'basic', name: 'Basic', blurb: 'For a pantry with a small team working together.' },
  { key: 'pro', name: 'Pro', blurb: 'For a growing organization with more stock and more hands.' },
  { key: 'enterprise', name: 'Enterprise', blurb: 'For networks with several locations.' },
];

function featuresFor(key) {
  const plan = PLANS[key];
  const list = [
    `${formatLimit(plan.limits.items)} inventory items`,
    `${formatLimit(plan.limits.users)} ${plan.limits.users === 1 ? 'team member' : 'team members'}`,
  ];
  if (plan.features.csv_export) list.push(key === 'free' ? 'CSV export' : 'Data export and reporting');
  if (plan.features.multi_site) list.push('Multiple locations');
  if (key === 'enterprise') list.push('Dedicated support');
  return list;
}

export default function PricingSection() {
  const { handleSignIn } = useAuthAction();

  return (
    <section className="bg-[#FCFAF7] pt-36 pb-24 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-32 overflow-x-clip">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">

        <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16 lg:mb-20">
          <h1
            className="stagger-animate opacity-0 text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl"
            style={{ willChange: 'transform, opacity, filter' }}
          >
            Simple pricing for every pantry
          </h1>
          <p
            className="stagger-animate opacity-0 mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed"
            style={{ animationDelay: '0.15s', willChange: 'transform, opacity, filter' }}
          >
            Start free with up to 150 items. Move to a paid plan when you need more items or more people on your team.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map(({ key, name, blurb }, i) => {
            const plan = PLANS[key];
            const isFree = key === 'free';
            const isEnterprise = key === 'enterprise';

            return (
              <div
                key={key}
                className="stagger-animate opacity-0 flex flex-col rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] sm:p-7"
                style={{ animationDelay: `${0.2 + i * 0.1}s`, willChange: 'transform, opacity, filter' }}
              >
                <h2 className="font-serif text-2xl text-hero-main">{name}</h2>
                <p className="mt-2 min-h-[3rem] text-[15px] font-light leading-snug text-hero-muted">{blurb}</p>

                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-serif text-[2.75rem] leading-none text-hero-main">
                    {plan.price === null ? 'Custom' : `$${plan.price}`}
                  </span>
                  {plan.price !== null && plan.price > 0 && <span className="text-[15px] text-hero-muted">/month</span>}
                </p>

                <ul className="mt-7 flex-1 space-y-3.5 border-t border-[#E7E5E4] pt-7">
                  {featuresFor(key).map((line) => (
                    <li key={line} className="flex items-start gap-3 text-[15px] leading-snug text-[#57534E]">
                      <Check size={16} strokeWidth={2.25} className="mt-[2px] shrink-0 text-[#B95B3E]" />
                      {line}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {isEnterprise ? (
                    <a
                      href="/contact?topic=enterprise"
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-[#E7E5E4] bg-white px-7 py-3 font-inter text-[15px] font-semibold text-[#1C1917] transition-colors duration-300 hover:border-[#D6D3D1] hover:bg-[#FAFAF9]"
                    >
                      Contact us
                    </a>
                  ) : isFree ? (
                    <button
                      type="button"
                      onClick={handleSignIn}
                      className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-7 py-3 font-inter text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)]"
                    >
                      Try for free
                      <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSignIn}
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-[#E7E5E4] bg-white px-7 py-3 font-inter text-[15px] font-semibold text-[#1C1917] transition-colors duration-300 hover:border-[#D6D3D1] hover:bg-[#FAFAF9]"
                    >
                      Choose {name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
