'use client';

import React, { Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { useIsDesktop, isDesktopNow } from '@/lib/first-paint';
import { EmptyCartLanding } from './empty-cart-landing';

const loadMobile = () => import('./mobile-add-flow').then((mod) => ({ default: mod.MobileAddFlow || mod.default }));

// On a phone, start downloading the add flow as soon as this page's code runs, alongside the
// page itself, instead of after the first render.
if (typeof window !== 'undefined' && !isDesktopNow()) loadMobile();

const MobileAddFlow = lazy(loadMobile);

const DesktopAddView = dynamic(
  () => import('./desktop-add-view').then((mod) => mod.DesktopAddView || mod.default),
  { ssr: false }
);

const noop = () => {};

// What the add flow draws first, drawn by the server so the page arrives already laid out. With
// items in the cart, a blank page rather than the landing, so the landing never flashes before it.
function MobileShell({ cartOpen }) {
  if (cartOpen) return <div className="absolute inset-0 z-50 bg-white" />;
  return (
    <AnimatePresence initial={false}>
      <EmptyCartLanding onBack={noop} shell />
    </AnimatePresence>
  );
}

const Spinner = ({ className = 'flex' }) => (
  <div className={`${className} h-[100dvh] items-center justify-center bg-gray-50`}>
    <Loader2 className="animate-spin h-8 w-8 text-[#d97757]" />
  </div>
);

// The first screen while the screen size is unknown: the phone layout (hidden on desktop). Drawn by
// the server, and by the page's loading outline (app/dashboard/add/loading.jsx) while it's on its way.
export function AddFirstScreen({ cartOpen = false }) {
  return (
    <>
      <div className="md:hidden"><MobileShell cartOpen={cartOpen} /></div>
      <Spinner className="hidden md:flex" />
    </>
  );
}

export function AddItemView({ cartOpen = false }) {
  const { isLoading } = usePantry();
  const isDesktop = useIsDesktop();

  // Server and hydration: the screen size is unknown.
  if (isDesktop === null) return <AddFirstScreen cartOpen={cartOpen} />;

  // Phones go straight in: the add flow doesn't need the pantry to draw its landing and cart, and
  // fills in pantry data as it arrives. Until its code is in, the same shell stays on screen.
  if (!isDesktop) {
    return (
      <Suspense fallback={<MobileShell cartOpen={cartOpen} />}>
        <MobileAddFlow />
      </Suspense>
    );
  }

  return isLoading ? <Spinner /> : <DesktopAddView />;
}
