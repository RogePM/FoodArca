import React from 'react';
import Image from 'next/image';

// One large photo that follows the open tab. All three are stacked and cross-fade, so the
// switch is smooth and the next photo is already loaded.
const PHOTOS = [
  { src: '/people/people1.jpg', alt: 'Food bank volunteer smiling while carrying a distribution box' },
  { src: '/person1.png', alt: 'Pantry team member checking stock on a tablet' },
  { src: '/people/people2.jpg', alt: 'Warehouse volunteer in a safety vest sorting donated food' },
];

export default function AnimatedImageGrid({ active = 0 }) {
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-[#EFE8E0] shadow-[0_10px_28px_-14px_rgba(0,0,0,0.3)]">
      {PHOTOS.map((photo, i) => (
        <Image
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(max-width: 1024px) 90vw, 46vw"
          quality={90}
          className={`object-cover transition-all duration-700 ease-out ${
            active === i ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0'
          }`}
          aria-hidden={active !== i}
        />
      ))}
    </div>
  );
}
