import React from 'react';

const POINTS = [
  {
    title: 'No more writing it down',
    body: 'Put away the clipboard and the Excel sheet. Scan or tap, and it is logged in seconds.',
  },
  {
    title: 'One source of truth',
    body: 'Every team member, on every phone and tablet, sees the same stock the moment it changes.',
  },
  {
    title: 'Easy with no training',
    body: 'A new volunteer can pick it up on their first shift, with nothing to learn first.',
  },
  {
    title: 'Less food wasted',
    body: 'See what is running low and what is close to expiring, so food gets to people while it is still good.',
  },
];

// A quiet introduction directly under the hero. It shares the hero's cream so the
// two read as one continuous page, then hands off to the grey feature section.
export default function IntroSection() {
  return (
    <section className="bg-[#FCFAF7] pt-14 pb-32 sm:pt-20 sm:pb-44 lg:pt-28 lg:pb-44 overflow-x-clip">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          {/* Each block fades in once as it scrolls into view (GlobalScrollObserver), a beat after the one before. */}
          <h2 className="stagger-animate opacity-0 text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl">
            Track your food without paper or spreadsheets
          </h2>
          <p
            className="stagger-animate opacity-0 mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed"
            style={{ animationDelay: '0.15s' }}
          >
            Food Arca tracks everything that comes in and goes out, across your whole team, in one place. It is built to streamline the flow of food, so you spend less time counting and more time feeding people.
          </p>
        </div>

        <ol className="mt-14 grid gap-10 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4 md:gap-8">
          {POINTS.map((point, i) => (
            <li
              key={point.title}
              className="stagger-animate opacity-0 border-t border-[#E7E5E4] pt-6"
              style={{ animationDelay: `${0.3 + i * 0.12}s` }}
            >
              <span className="text-xs tabular-nums text-hero-muted">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-8 font-serif text-xl text-hero-main">{point.title}</h3>
              <p className="mt-4 text-base font-light leading-relaxed text-hero-muted">
                {point.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
