'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { GiveOutScene, HeroScene, SCENES, SceneLines } from '@/components/Frontend/Feature/FeatureScenes';

// One product scene in a coloured panel. It starts when it scrolls into view and has a Replay button,
// the same behaviour as the home page's feature cards.
const SCENE_BY_NAME = {
  scan: SCENES[0],
  devices: SCENES[1],
  report: SCENES[2],
  giveout: GiveOutScene,
  hero: HeroScene,
};

export default function JobScene({ scene, color, label, tall = false }) {
  const Scene = SCENE_BY_NAME[scene];
  const ref = useRef(null);
  const [plays, setPlays] = useState(0);

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
    <div ref={ref}>
      <div
        className={`relative flex flex-col justify-center overflow-hidden rounded-2xl px-4 py-6 sm:px-8 ${
          tall ? 'min-h-[460px] sm:min-h-[520px] lg:min-h-[580px]' : 'min-h-[420px] sm:min-h-[460px]'
        }`}
        style={{ background: color }}
      >
        <SceneLines />
        <div className="relative mx-auto flex w-full max-w-[480px] flex-col gap-3">
          {plays > 0 && (
            <div key={plays} className="flex flex-col gap-3" aria-label={`${label}, animated example`}>
              <Scene />
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPlays((n) => n + 1)}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[13px] font-medium text-[#57534E] transition-colors hover:bg-[#F5F5F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/40"
      >
        Replay <RotateCcw size={14} />
      </button>
    </div>
  );
}
