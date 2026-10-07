import React from 'react';
import { Check } from 'lucide-react';

// Reading-column layout for legal pages (Privacy now, Terms later). Marketing style: cream page, serif
// headings, light body text, no visuals. Pass the sections as data; write each body with P, UL and B below.

export const P = ({ children }) => <p className="mt-4 first:mt-0">{children}</p>;

export const B = ({ children }) => <strong className="font-semibold text-[#1C1917]">{children}</strong>;

export const H3 = ({ children }) => (
  <h3 className="mt-8 font-serif text-[1.15rem] leading-snug text-hero-main sm:text-[1.25rem]">{children}</h3>
);

export const UL = ({ children }) => (
  <ul className="mt-4 space-y-2.5 pl-5 [&>li]:list-disc [&>li]:pl-1 [&>li]:marker:text-[#B95B3E]">{children}</ul>
);

export default function LegalDocument({ title, subtitle, updated, summary = [], sections }) {
  return (
    <section className="bg-[#FCFAF7] pt-36 pb-24 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-32 overflow-x-clip">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">

        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-14 lg:mb-16">
          <h1
            className="stagger-animate opacity-0 text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl"
            style={{ willChange: 'transform, opacity, filter' }}
          >
            {title}
          </h1>
          <p
            className="stagger-animate opacity-0 mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed"
            style={{ animationDelay: '0.15s', willChange: 'transform, opacity, filter' }}
          >
            {subtitle}
          </p>
          <p
            className="stagger-animate opacity-0 mt-4 text-[13px] text-[#78716C]"
            style={{ animationDelay: '0.25s', willChange: 'transform, opacity, filter' }}
          >
            Last updated {updated}
          </p>
        </div>

        <div className="mx-auto max-w-3xl">

          {summary.length > 0 && (
            <div className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] sm:p-8">
              <h2 className="font-serif text-[1.35rem] text-hero-main">The short version</h2>
              <ul className="mt-5 space-y-3.5">
                {summary.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-[15px] leading-snug text-[#57534E]">
                    <Check size={16} strokeWidth={2.25} className="mt-[2px] shrink-0 text-[#B95B3E]" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[13.5px] font-light leading-relaxed text-hero-muted">
                This summary is a convenience. The full policy below is what applies.
              </p>
            </div>
          )}

          <nav aria-label="On this page" className="mt-12">
            <p className="text-[13px] font-medium text-[#78716C]">On this page</p>
            <ol className="mt-3 grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-[#B95B3E] hover:text-[#9A4A30]">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-14">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 border-t border-[#E7E5E4] py-10 sm:py-12">
                <h2 className="font-serif text-[1.5rem] leading-snug text-hero-main sm:text-[1.75rem]">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-5 text-base font-light leading-relaxed text-hero-muted sm:text-[17px]">{s.body}</div>
              </section>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
