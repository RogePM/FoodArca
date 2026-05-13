'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import dynamic from 'next/dynamic';

// Dynamically import siblings from the same folder
const DesktopAddView = dynamic(
  () => import('./desktop-add-view').then((mod) => mod.DesktopAddView),
  { ssr: false }
);

const MobileAddFlow = dynamic(
  () => import('./mobile-add-flow').then((mod) => mod.MobileAddFlow),
  { ssr: false }
);

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

export function AddItemView() {
  const { isLoading } = usePantry();
  const isDesktop = useMediaQuery("(min-width: 768px)"); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-[#d97757]" />
      </div>
    );
  }

  // Routes to the correct sibling file based on device
  return isDesktop ? <DesktopAddView /> : <MobileAddFlow />;
}