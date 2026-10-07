import React from 'react';

// Hero backdrop: soft layered hills, drawn only with long cubic Bézier paths.
// No circles, ellipses, blobs, radial gradients or blur. Each hill is a ridge
// line with a real crest (rise, peak, long fall toward the centre) filled
// downward. A horizontal gradient makes every fill strongest at the screen edge
// and fully transparent toward the middle, so the inner side dissolves into the
// page instead of ending in a hard line. Layers overlap and show through each
// other, like translucent paper.
//
//   hero-layer-01  atmosphere        flat warm wash (no shape)
//   hero-layer-02  far-left          pale beige S-sweep from the top-left
//   hero-layer-03  far-right         pale beige arch, raised at the top-right
//   hero-layer-04  middle-left       peach S-sweep
//   hero-layer-05  middle-right      peach swoosh climbing to the right edge
//   hero-layer-06  foreground-flow   one continuous coral path under both sides
//   hero-layer-07  contour-lines     one hairline per side, on the left beige sweep and the right peach swoosh
//
// The centre is kept empty (headline, buttons, dashboard). Decorative, so aria-hidden.
//
// Geometry: the drawing is 2400x1300 (the viewBox starts at y -170 and runs to
// 1429, which adds overscan above and below the hero) and is stretched to fill each layer
// (preserveAspectRatio="none"), so the hills always span the viewport width and
// the crests stay on screen from laptop to ultrawide. The curves are gentle
// enough that the stretch is not visible. Layers are 20% wider than the hero on
// each side, with paths drawn past the viewBox, so parallax never exposes an
// empty edge. The crests sit about level with the subtitle and buttons, and the
// coral sits low in the corners.

const VIEWBOX = '0 -170 2400 1599';

// The two sides are deliberately different characters, as in the reference:
//
//   LEFT   rolling S-sweeps with a double bend. High at the screen edge, a convex
//          shoulder, a short flat shelf, then a second, longer slide toward the
//          dashboard. The bends are staggered between layers so the edges never
//          line up. No crest on screen.
//   RIGHT  a raised arch on top (beige) and swooshes below it (peach, coral) that
//          climb in a single concave curve up to the right edge.
//
// Left ridges run left to right and stop under the dashboard (x ~1150-1250).
const FAR_L = 'M -200 330 C 0 290, 140 300, 260 380 C 340 435, 380 500, 480 505 C 590 510, 650 560, 780 625 S 1010 680, 1160 690';
const MID_L = 'M -200 520 C 20 490, 190 480, 320 560 C 410 615, 460 680, 560 690 C 680 700, 740 740, 860 790 S 1080 830, 1220 840';
// Right ridges run right to left.
const FAR_R = 'M 2600 540 C 2440 480, 2200 380, 1960 390 C 1760 400, 1650 560, 1450 620 S 1300 700, 1260 720';
const MID_R = 'M 2600 590 C 2320 600, 2040 640, 1780 730 S 1420 860, 1220 890';
// One continuous coral path: it slides down from the left edge, rests in a shallow
// valley under the dashboard, then climbs steeply to the right edge. The gradient
// keeps only the two corners visible.
const FOREGROUND =
  'M -200 640 C 20 620, 190 620, 330 690 C 430 740, 500 800, 620 810 C 760 822, 860 900, 1060 990 C 1260 1080, 1420 1010, 1600 960 C 1800 915, 1900 800, 2100 760 S 2450 700, 2600 700';

// Fill everything beneath a ridge, closing the shape at the given x range.
const fillBelow = (d, xStart, xEnd) => `${d} L ${xEnd} 1900 L ${xStart} 1900 Z`;

function Layer({ n, className = '', children }) {
  return (
    <div
      className={`hero-layer hero-layer-${n} absolute -left-[20%] -right-[20%] -top-[20%] -bottom-[30%] md:[@media(hover:hover)]:will-change-transform ${className}`}
    >
      <svg
        className="h-full w-full"
        viewBox={VIEWBOX}
        preserveAspectRatio="none"
        focusable="false"
      >
        {children}
      </svg>
    </div>
  );
}

// Horizontal fade: `color` at the screen edge, transparent at the inner end.
function EdgeFade({ id, from, to, color, opacity = 1, mid = 0.85 }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={from} y1="0" x2={to} y2="0">
      <stop offset="0" stopColor={color} stopOpacity={opacity} />
      <stop offset="0.55" stopColor={color} stopOpacity={opacity * mid} />
      <stop offset="1" stopColor={color} stopOpacity="0" />
    </linearGradient>
  );
}

// Contour lines: thin, open, never closed. Each one sits a little inside a ridge.
const CONTOURS = [
  { side: 'l', dy: 36, d: FAR_L },
  { side: 'r', dy: 40, d: MID_R },
];

const LINE = {
  fill: 'none',
  strokeWidth: 1,
  strokeLinecap: 'round',
  vectorEffect: 'non-scaling-stroke',
};

// Phones: the wide drawing above is built around an empty middle and gets squeezed
// into a notch on a narrow screen, so phones get their own still drawing instead:
// three full-width swells rising from the bottom, beige, peach, then coral, each
// fading out toward the top so there is never a hard seam. No motion, no layers.
const M_VIEWBOX = '0 0 400 800';
const M_BEIGE = 'M 0 440 C 90 405, 170 470, 270 450 S 370 405, 400 415 L 400 800 L 0 800 Z';
const M_PEACH = 'M 0 540 C 100 500, 190 575, 290 548 S 375 505, 400 512 L 400 800 L 0 800 Z';
const M_CORAL = 'M 0 650 C 110 612, 205 690, 305 660 S 380 630, 400 634 L 400 800 L 0 800 Z';

function MobileBackdrop() {
  return (
    <svg
      className="absolute inset-0 h-full w-full md:hidden"
      viewBox={M_VIEWBOX}
      preserveAspectRatio="none"
      focusable="false"
    >
      <defs>
        <linearGradient id="hbm-beige" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" stopColor="#EFE8E0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#EFE8E0" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="hbm-peach" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.6" stopColor="#F7D9CD" stopOpacity="0.95" />
          <stop offset="1" stopColor="#F7D9CD" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="hbm-coral" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.75" stopColor="#F0AB93" stopOpacity="0.95" />
          <stop offset="1" stopColor="#EFA58D" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <path d={M_BEIGE} fill="url(#hbm-beige)" />
      <path d={M_PEACH} fill="url(#hbm-peach)" />
      <path d={M_CORAL} fill="url(#hbm-coral)" />
      <path {...LINE} stroke="#E7B5A5" strokeOpacity="0.45" transform="translate(0 22)" d="M 0 440 C 90 405, 170 470, 270 450 S 370 405, 400 415" />
    </svg>
  );
}

export default function HeroBackdrop() {
  return (
    // Pinned to the first screen (the layers are drawn for exactly one screen of
    // height) and dissolved at its bottom edge, so the landscape melts into the
    // page instead of ending in a hard line when the dashboard is revealed.
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[100dvh] overflow-hidden bg-[#FCFAF7] [mask-image:linear-gradient(to_bottom,black_93%,transparent)] md:[mask-image:linear-gradient(to_bottom,black_88%,transparent)]"
    >
      <MobileBackdrop />

      <div className="absolute inset-0 hidden md:block">
      {/* 01 · atmosphere: a flat wash, slightly warmer toward the bottom */}
      <Layer n="01">
        <defs>
          <linearGradient id="hb-atmosphere" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FCFAF7" />
            <stop offset="0.6" stopColor="#FCFAF7" />
            <stop offset="1" stopColor="#FBF3EC" />
          </linearGradient>
        </defs>
        <rect x="-200" y="-400" width="2800" height="2300" fill="url(#hb-atmosphere)" />
      </Layer>

      {/* 02 · far left: pale beige hill */}
      <Layer n="02">
        <defs>
          <EdgeFade id="hb-far-l" from={-200} to={1160} color="#EFE8E0" />
        </defs>
        <path d={fillBelow(FAR_L, -200, 1160)} fill="url(#hb-far-l)" />
      </Layer>

      {/* 03 · far right: pale beige hill */}
      <Layer n="03">
        <defs>
          <EdgeFade id="hb-far-r" from={2600} to={1260} color="#EFE8E0" />
        </defs>
        <path d={fillBelow(FAR_R, 2600, 1260)} fill="url(#hb-far-r)" />
      </Layer>

      {/* 04 · middle left: peach hill */}
      <Layer n="04">
        <defs>
          <EdgeFade id="hb-mid-l" from={-200} to={1220} color="#F7D9CD" opacity={1} />
        </defs>
        <path d={fillBelow(MID_L, -200, 1220)} fill="url(#hb-mid-l)" />
      </Layer>

      {/* 05 · middle right: peach hill */}
      <Layer n="05">
        <defs>
          <EdgeFade id="hb-mid-r" from={2600} to={1220} color="#F7D9CD" opacity={1} />
        </defs>
        <path d={fillBelow(MID_R, 2600, 1220)} fill="url(#hb-mid-r)" />
      </Layer>

      {/* 06 · foreground: the strongest form, coral in both bottom corners, clear in the middle */}
      <Layer n="06">
        <defs>
          <linearGradient id="hb-foreground" gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="2600" y2="0">
            <stop offset="0" stopColor="#EFA58D" stopOpacity="1" />
            <stop offset="0.16" stopColor="#F0AB93" stopOpacity="0.92" />
            <stop offset="0.34" stopColor="#F2B7A2" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#F2B7A2" stopOpacity="0" />
            <stop offset="0.62" stopColor="#F2B7A2" stopOpacity="0.6" />
            <stop offset="0.78" stopColor="#F0AB93" stopOpacity="0.96" />
            <stop offset="1" stopColor="#EFA58D" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d={fillBelow(FOREGROUND, -200, 2600)} fill="url(#hb-foreground)" />
      </Layer>

      {/* 07 · contour lines: sparse hairlines that follow the hills above */}
      <Layer n="07">
        <defs>
          {/* fade toward the centre: left lines are full until x~700 and gone by x~1000; right lines mirror that */}
          <linearGradient id="hb-line-l" gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="1000" y2="0">
            <stop offset="0" stopColor="#E7B5A5" stopOpacity="0.45" />
            <stop offset="0.75" stopColor="#E7B5A5" stopOpacity="0.45" />
            <stop offset="1" stopColor="#E7B5A5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hb-line-r" gradientUnits="userSpaceOnUse" x1="2600" y1="0" x2="1400" y2="0">
            <stop offset="0" stopColor="#E7B5A5" stopOpacity="0.45" />
            <stop offset="0.75" stopColor="#E7B5A5" stopOpacity="0.45" />
            <stop offset="1" stopColor="#E7B5A5" stopOpacity="0" />
          </linearGradient>
        </defs>

        {CONTOURS.map(({ d, dy, side }) => (
          <path key={`${side}-${dy}-${d}`} {...LINE} stroke={`url(#hb-line-${side})`} transform={`translate(0 ${dy})`} d={d} />
        ))}
      </Layer>
      </div>
    </div>
  );
}
