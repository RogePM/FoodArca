'use client';

import React, { useEffect, useRef } from 'react';

// The landscape only moves on desktop (wide screen, real pointer). Phones and touch
// tablets get the same hills as a still picture: no GSAP is even downloaded, there are
// no per-frame tweens competing with taps, and no layer is promoted to the GPU.
const MOVES = '(min-width: 768px) and (hover: hover) and (pointer: fine)';

export default function HeroContainer({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia(MOVES).matches) return;

    let cancelled = false;
    let teardown;

    (async () => {
    const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    if (cancelled) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    
    // Parallax is decoration: skip it entirely for people who prefer reduced motion.
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const scrub = {
        trigger: containerRef.current,
        start: 'top top',
        // The hero is now taller than the screen, but the landscape only lives on
        // the first screen, so its parallax runs over one screen of scrolling.
        end: () => `+=${window.innerHeight}`,
        scrub: true,
        invalidateOnRefresh: true,
      };

      // Backdrop layers by depth: far ones barely move, near ones travel the most.
      // Each layer lags the page as you scroll (it moves down while the page moves
      // up), the nearer the layer the more it lags, so the dashboard visibly pulls
      // away from a landscape that sits behind it. The sideways drift is larger on
      // the foreground, and the two middle flows drift in opposite directions.
      // Layers extend well past the hero on every side, so none of this exposes an edge.
      const Y = 80; // yPercent per unit of depth
      const X = 26; // xPercent per unit of depth
      const layers = [
        ['01', 0.05, 0], //   atmosphere
        ['02', 0.1, -1], //   far left
        ['03', 0.1, 1], //    far right
        ['04', 0.18, -1], //  middle left
        ['05', 0.18, 1], //   middle right
        ['06', 0.28, -1], //  foreground
        ['07', 0.35, 1], //   contour lines
      ];
      layers.forEach(([n, depth, dir], i) => {
        const layer = `.hero-layer-${n}`;
        gsap.to(layer, {
          yPercent: depth * Y,
          xPercent: dir * depth * X,
          scale: 1 + depth * 0.2,
          ease: 'none',
          scrollTrigger: scrub,
        });

        // A slow idle drift on top of the scroll movement, so the landscape is
        // alive before anyone scrolls. Nearer layers drift further; each one
        // has its own period so they never move in lockstep. The atmosphere
        // wash stays still.
        if (depth > 0.05) {
          gsap.to(layer, {
            x: dir * (20 + depth * 110),
            y: (i % 2 ? -1 : 1) * (10 + depth * 60),
            duration: 5 + i * 1.1,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
        }
      });
    }, containerRef);

    // Mouse parallax: with a real pointer, the layers follow the cursor, the
    // nearer ones further. It moves the <svg> inside each layer, so it stacks
    // with the scroll and idle movement instead of fighting it.
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const section = containerRef.current;
      const depths = { '02': 0.1, '03': 0.1, '04': 0.18, '05': 0.18, '06': 0.28, '07': 0.35 };
      const MOUSE = 260; // px of travel per unit of depth across half the screen
      const movers = Object.entries(depths).map(([n, depth]) => {
        const svg = section.querySelector(`.hero-layer-${n} svg`);
        const opts = { duration: 1.4, ease: 'power3.out' };
        return { depth, x: gsap.quickTo(svg, 'x', opts), y: gsap.quickTo(svg, 'y', opts) };
      });

      const onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        movers.forEach(({ depth, x, y }) => {
          x(-nx * depth * MOUSE * 2);
          y(-ny * depth * MOUSE);
        });
      };
      section.addEventListener('pointermove', onMove);
      return () => section.removeEventListener('pointermove', onMove);
    }, containerRef);

    teardown = () => mm.revert();
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="hero-section relative min-h-[100dvh] pt-[4.5rem] sm:pt-[5rem] pb-6 lg:pb-8 px-4 sm:px-6 md:px-8 overflow-hidden flex flex-col items-center isolate bg-[#FCFAF7]"
    >
      {children}
    </section>
  );
}