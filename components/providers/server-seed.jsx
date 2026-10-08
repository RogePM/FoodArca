'use client';

// Data a page fetched on the server for its first screen, handed to the components that draw it
// without threading props through every layer: the page wraps its view in <ServerSeed seed={...}>,
// a component reads its part with useSeed('name'). Seeds are a head start only; components still
// load and stay live on their own (lib/use-inventory, realtime) and switch to that once it's current.

import React, { createContext, useContext } from 'react';

const SeedContext = createContext({});

export function ServerSeed({ seed, children }) {
  return <SeedContext.Provider value={seed || {}}>{children}</SeedContext.Provider>;
}

export const useSeed = (name) => useContext(SeedContext)[name] ?? null;
