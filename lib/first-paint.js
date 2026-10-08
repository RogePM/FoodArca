'use client';

// Helpers that let Add and Remove draw their real first screen on the server (no spinner, no flash):
// the server can't see the screen size, so pages draw the phone layout, hidden on desktop.

import { useSyncExternalStore } from 'react';

export const DESKTOP_QUERY = '(min-width: 768px)';

const subscribe = (onChange) => {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
export const isDesktopNow = () => window.matchMedia(DESKTOP_QUERY).matches;
const unknownOnServer = () => null;

/** true/false in the browser; null on the server and while hydrating (screen size unknown there). */
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, isDesktopNow, unknownOnServer);
}

// Cookies don't announce changes; a loading outline only needs the value at the moment it's drawn.
const noSubscribe = () => () => {};
const noCartOnServer = () => false;

/** Whether a cart hint cookie (lib/hint-cookies CART_HINT) says that cart has items. false on the server. */
export function useCartHint(name) {
  return useSyncExternalStore(
    noSubscribe,
    () => document.cookie.split('; ').includes(`${name}=1`),
    noCartOnServer
  );
}

