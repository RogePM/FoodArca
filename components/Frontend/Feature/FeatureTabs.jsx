'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { SCENES, SceneLines } from './FeatureScenes';

// The scenes are drawn at a fixed width and scaled to fit their panel, so the devices
// never get squeezed. Phones use the natural responsive layout instead.
const STAGE_W = 480;

const PANEL_COLORS = ['#F2D5C6', '#BFD1C8', '#D3D1E0'];

// Desktop: the section is pinned while you scroll, and the cards are stacked in one
// spot, first card on top. Scrolling flicks the top card away to the right (with a slight
// tilt), which reveals the next card already waiting underneath. Nothing is ever visible
// outside the panel. Scroll progress (0 to 1 over the pinned distance) for each flick:
const FLICKS = [[0.18, 0.42], [0.58, 0.82]]; // card 0 leaves, then card 1 leaves
const HOLD_AT = [0.02, 0.5, 0.97]; // where each card sits when you click its title
const PIN_TOP = 96; // px, clears the fixed nav
const FLICK_TILT = 7; // degrees the leaving card turns
// Cards waiting underneath show their top edge above the one in front (like tabs), each
// one a little higher and narrower, and they settle forward as the cards ahead leave.
const DEPTH_SHIFT = 16; // px higher per card behind
const DEPTH_SCALE = 0.04; // narrower per card behind
const restTransform = (depth) => `translateY(${-DEPTH_SHIFT * depth}px) scale(${1 - DEPTH_SCALE * depth})`;

const features = [
  {
    id: 0,
    title: 'Barcode Scanning for Speed',
    description: 'Camera barcode scanning makes it easy to intake and distribute food quickly.',
    points: [
      { lead: 'Seconds, not minutes.', text: 'Scan the barcode instead of typing out every item.' },
      { lead: 'Fewer mistakes.', text: 'No misspelled names or wrong counts to clean up later.' },
      { lead: 'Anyone can do it.', text: 'A new volunteer can keep the line moving on their first shift.' },
    ],
    link: '/',
  },
  {
    id: 1,
    title: 'Works on Any Device',
    description:
      'Web-based, so it works on any device with a camera and internet connection. No more expensive hardware to buy or maintain.',
    points: [
      { lead: 'No hardware to buy.', text: 'Use the phones, tablets and laptops you already have.' },
      { lead: 'Nothing to install.', text: 'Open the browser, sign in and start working.' },
      { lead: 'Everyone sees the same stock.', text: 'Every device updates the moment something changes.' },
    ],
    link: '/',
  },
  {
    id: 2,
    title: 'Export data for reports',
    description:
      'Measure what matters with Food Arca’s easy-to-use reports. You can export, and drilldown on the data in a couple clicks.',
    points: [
      { lead: 'Know what you have.', text: 'Stock, food given out and what is expiring, at a glance.' },
      { lead: 'Ready when you need it.', text: 'Export in one click for funders, partners or your board.' },
      { lead: 'Catch waste early.', text: 'See what is close to expiring while there is still time to give it out.' },
    ],
    link: '/',
  },
];

// Decide phone vs desktop before the first paint, so desktop never flashes the phone layout.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const smooth = (t) => t * t * (3 - 2 * t);

// One flash card: a colored panel holding one scene, scaled to fit its width.
function ScenePanel({ index, plays, replayKey, setRef, stacked, visible }) {
  const stageRef = useRef(null);
  const innerRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, height: null });
  const Scene = SCENES[index];

  useEffect(() => {
    const stage = stageRef.current;
    const inner = innerRef.current;
    if (!stage || !inner) return;
    const measure = () => {
      if (window.innerWidth < 640) {
        setFit((f) => (f.scale === 1 && f.height === null ? f : { scale: 1, height: null }));
        return;
      }
      const scale = Math.min(1.1, stage.clientWidth / STAGE_W);
      setFit({ scale, height: inner.offsetHeight * scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [plays, visible]);

  return (
    <div
      ref={setRef}
      className={`${stacked ? 'absolute inset-x-0 bottom-0' : visible ? 'relative' : 'hidden'} flex flex-col justify-center overflow-hidden rounded-2xl px-4 py-6 will-change-transform sm:px-8 ${stacked ? 'h-[440px] sm:h-[480px] lg:h-[520px]' : 'min-h-[440px] sm:h-[480px] lg:h-[520px]'}`}
      style={{ background: PANEL_COLORS[index], transformOrigin: 'top center', transform: stacked ? restTransform(index) : undefined }}
    >
      <SceneLines />
      <div ref={stageRef} className="relative w-full" style={fit.height ? { height: fit.height } : undefined}>
        <div
          ref={innerRef}
          className="flex flex-col gap-3"
          style={fit.height ? { width: STAGE_W, marginInline: 'auto', transform: `scale(${fit.scale})`, transformOrigin: 'top left' } : undefined}
        >
          {plays > 0 && (
            <div
              key={`${index}-${plays}-${replayKey}`}
              className="flex flex-col gap-3"
              aria-label={`${features[index].title}, animated example`}
            >
              <Scene />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Phones and tablets: no pinning and no tabs. Each feature is its own block, in the
// order heading, short text, then its card (the benefit points are desktop only); the scene plays when the
// card scrolls into view.
function MobileFeature({ feature, index }) {
  const ref = useRef(null);
  const [plays, setPlays] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlays(1);
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article>
      <h3 className="font-serif text-[1.65rem] leading-[1.15] tracking-tight text-[#1C1917]">{feature.title}</h3>
      <p className="mt-3 text-[16px] leading-relaxed text-[#57534E]">{feature.description}</p>
      <a
        href={feature.link}
        className="mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-[#B95B3E] transition-colors hover:text-[#9A4A30]"
      >
        Learn more <ArrowRight size={17} />
      </a>

      <div ref={ref} className="mt-7">
        <ScenePanel index={index} plays={plays} replayKey={replayKey} setRef={() => {}} stacked={false} visible />
        <button
          type="button"
          onClick={() => setReplayKey((k) => k + 1)}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[13px] font-medium text-[#57534E] transition-colors hover:bg-[#F5F5F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/40"
        >
          Replay <RotateCcw size={14} />
        </button>
      </div>
    </article>
  );
}

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState(0);
  // How many times each scene has been started. A scene plays when its card becomes the
  // open one (and plays again each time you come back to it), so you always see it begin.
  const [plays, setPlays] = useState([0, 0, 0]);
  // Bumped by Replay to restart the open scene from its first card.
  const [replayKey, setReplayKey] = useState(0);
  const [inView, setInView] = useState(false);
  const [isLg, setIsLg] = useState(false);

  const wrapperRef = useRef(null); // tall element that provides the scroll distance
  const pinRef = useRef(null); // the sticky content
  const panelRefs = useRef([]);
  const activeRef = useRef(0);

  const play = useCallback((i) => {
    setPlays((v) => v.map((n, k) => (k === i ? n + 1 : n)));
  }, []);

  // Fade the section in once the pinned area is on screen, and start the first scene
  // only when most of it is showing, so its first cards are not missed while scrolling in.
  const firstPlayed = useRef(false);
  useEffect(() => {
    const target = pinRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.15) setInView(true);
        if (entry.intersectionRatio >= 0.5 && !firstPlayed.current) {
          firstPlayed.current = true;
          play(0);
          observer.disconnect();
        }
      },
      { threshold: [0.15, 0.5] }
    );
    observer.observe(target);
    return () => observer.disconnect();
    // Re-run when the layout flips: the pinned element only exists on desktop, and if it
    // were missed here the columns would stay at opacity 0 (invisible) for good.
  }, [play, isLg]);

  useIsoLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setIsLg(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Desktop only: drive the stack straight from scroll. Transforms are written to the
  // DOM directly (no React render per frame); state only changes when the open card does.
  useEffect(() => {
    if (!isLg) return;
    const wrapper = wrapperRef.current;
    const pin = pinRef.current;
    if (!wrapper || !pin) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scroll events already arrive once per frame, so this runs straight from the handler.
    const update = () => {
      const distance = wrapper.offsetHeight - pin.offsetHeight;
      // Start the first scene once half of the pinned area is on screen.
      const r = pin.getBoundingClientRect();
      const shown = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      // Also reveal from scroll, so a reload that lands mid-section never leaves it hidden.
      if (shown > r.height * 0.15) setInView(true);
      if (!firstPlayed.current && shown >= r.height * 0.5) {
        firstPlayed.current = true;
        play(0);
      }
      const p = clamp01((PIN_TOP - wrapper.getBoundingClientRect().top) / Math.max(1, distance));

      // How far each card has left (the last card never leaves).
      const leave = [...FLICKS.map(([from, to]) => smooth(clamp01((p - from) / (to - from)))), 0];
      leave.forEach((out, i) => {
        const el = panelRefs.current[i];
        if (!el) return;
        const gone = reduce ? (out > 0.5 ? 1 : 0) : out;
        // How many cards are still in front of this one (fractions while they leave).
        let depth = i;
        for (let j = 0; j < i; j++) depth -= reduce ? (leave[j] > 0.5 ? 1 : 0) : leave[j];
        el.style.transformOrigin = gone ? 'bottom right' : 'top center';
        el.style.transform = gone
          ? `translateX(${gone * 115}%) rotate(${gone * FLICK_TILT}deg)`
          : restTransform(Math.max(0, depth));
        el.style.visibility = gone >= 1 ? 'hidden' : 'visible';
        el.style.zIndex = String(PANEL_COLORS.length - i);
      });

      const open = leave[1] > 0.5 ? 2 : leave[0] > 0.5 ? 1 : 0;
      if (open !== activeRef.current) {
        activeRef.current = open;
        setActiveTab(open);
        play(open);
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [isLg, play]);

  // Below desktop there is no pinning: the titles switch the one visible panel.
  useEffect(() => {
    if (isLg) return;
    panelRefs.current.forEach((el) => {
      if (el) el.style.transform = '';
    });
  }, [isLg]);

  const handleTabClick = (index) => {
    // Scroll to where that card is showing.
    const wrapper = wrapperRef.current;
    const pin = pinRef.current;
    const distance = wrapper.offsetHeight - pin.offsetHeight;
    const top = wrapper.getBoundingClientRect().top + window.scrollY - PIN_TOP + HOLD_AT[index] * distance;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  if (!isLg) {
    return (
      <div ref={wrapperRef} className="space-y-16 py-4">
        {features.map((feature, index) => (
          <MobileFeature key={feature.id} feature={feature} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative lg:h-[320vh]">
      <div
        ref={pinRef}
        className="flex flex-col gap-10 py-12 lg:sticky lg:h-[calc(100vh-6rem)] lg:flex-row lg:items-center lg:gap-14 lg:py-0"
        style={isLg ? { top: PIN_TOP } : undefined}
      >
        {/* --- Left Column: the three features. The open one gets the big serif heading. --- */}
        <div className="z-10 flex w-full flex-col gap-7 lg:w-[38%] lg:pb-16">
          {features.map((feature, index) => {
            const isActive = activeTab === index;

            return (
              <div
                key={feature.id}
                className={`opacity-0 ${isActive ? '' : 'lg:hidden'} ${inView ? 'animate-water-wash' : ''}`}
                style={{ animationDelay: `${index * 0.15}s`, willChange: 'transform, opacity, filter' }}
              >
                <button
                  type="button"
                  onClick={() => handleTabClick(index)}
                  aria-expanded={isActive}
                  className={`text-left font-serif tracking-tight transition-all duration-300 ${
                    isActive
                      ? 'text-[1.65rem] leading-[1.15] text-[#1C1917] lg:text-[1.9rem]'
                      : 'text-[1.25rem] leading-tight text-[#1C1917]/45 hover:text-[#1C1917]/75'
                  }`}
                >
                  {feature.title}
                </button>

                {isActive && (
                  <div key={activeTab} className="auth-step mt-4">
                    <p className="text-[16px] leading-relaxed text-[#57534E]">{feature.description}</p>
                    {/* What this changes for the team: the effect, not the steps. */}
                    {/* Checked, indented points, so they read as a list under the description and not as more heading text. */}
                    <ul className="mt-8 space-y-4 pl-1">
                      {feature.points.map((point) => (
                        <li key={point.lead} className="flex items-start gap-3">
                          <Check size={16} strokeWidth={2.25} className="mt-[3px] shrink-0 text-[#B95B3E]" />
                          <p className="text-[15px] leading-snug text-[#57534E]">
                            <span className="font-semibold text-[#1C1917]">{point.lead}</span>
                            <span className="mt-0.5 block leading-relaxed">{point.text}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={feature.link}
                      className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-[#B95B3E] transition-colors hover:text-[#9A4A30]"
                    >
                      Learn more <ArrowRight size={17} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- Right Column: the stack of scene cards --- */}
        <div
          className={`relative z-10 w-full opacity-0 lg:w-[62%] ${inView ? 'animate-water-wash' : ''}`}
          style={{ animationDelay: '0.1s', willChange: 'transform, opacity, filter' }}
        >
          <div className="relative pt-6 lg:pt-0">
            {/* Below desktop, the two cards not showing peek out behind the open one. */}
            {!isLg && (
              <>
                <div className="absolute inset-x-[8%] top-0 h-8 rounded-t-2xl transition-colors duration-500" style={{ background: PANEL_COLORS[(activeTab + 1) % 3] }} />
                <div className="absolute inset-x-[4%] top-[10px] h-8 rounded-t-2xl transition-colors duration-500" style={{ background: PANEL_COLORS[(activeTab + 2) % 3] }} />
              </>
            )}

            <div className={isLg ? 'relative h-[552px] overflow-hidden' : 'relative'}>
              {PANEL_COLORS.map((_, i) => (
                <ScenePanel
                  key={i}
                  index={i}
                  plays={plays[i]}
                  replayKey={replayKey}
                  stacked={isLg}
                  visible={isLg || activeTab === i}
                  setRef={(el) => {
                    panelRefs.current[i] = el;
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setReplayKey((k) => k + 1)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[13px] font-medium text-[#57534E] transition-colors hover:bg-[#F5F5F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/40"
          >
            Replay <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
