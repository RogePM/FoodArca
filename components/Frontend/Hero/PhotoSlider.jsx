'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import vest from '@/public/people/slide-vest.jpg';
import box from '@/public/people/slide-box.jpg';
import girl from '@/public/people/slide-girl.jpg';
import family from '@/public/people/slide-family.jpg';
import volunteer from '@/public/people/slide-volunteer.jpg';
import tablet from '@/public/people/slide-tablet.jpg';

// Mixed on purpose: the two dinner-table photos are never next to each other.
const SLIDES = [
  { src: tablet, alt: 'A warehouse worker in a black vest checking stock on a tablet' },
  { src: vest, alt: 'A smiling warehouse worker leaning over stacked cartons of supplies' },
  { src: girl, alt: 'A child at a candlelit family dinner table' },
  { src: box, alt: 'A worker lifting a large carton into a delivery truck' },
  { src: family, alt: 'A mother hugging her son at a set dinner table' },
  { src: volunteer, alt: 'A volunteer smiling as she carries a box of donated food' },
];

const INTERVAL_MS = 6000;

export default function PhotoSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Respect reduced motion: show the first photo and stay put.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, active]);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, i) => (
        <Image
          key={i}
          src={slide.src}
          alt={slide.alt}
          fill
          quality={85}
          placeholder="blur"
          sizes="(min-width: 1360px) 616px, calc((100vw - 128px) / 2)"
          aria-hidden={i !== active}
          // Opacity-only crossfade: no scaling, so every photo is shown 1:1 and stays sharp.
          className={`object-cover transition-opacity duration-1000 ease-out motion-reduce:transition-none ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show photo ${i + 1} of ${SLIDES.length}`}
            aria-current={i === active}
            className="group flex h-6 items-center focus-visible:outline-none"
          >
            <span
              className={`block h-1.5 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-black/40 ${
                i === active ? 'w-6 opacity-100' : 'w-1.5 opacity-60 group-hover:opacity-90'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
