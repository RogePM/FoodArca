'use client';

import React, { useState, useEffect } from 'react';
import { usePantry } from '@/components/providers/PantryProvider';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { useDashboardRoute } from '@/components/layout/use-dashboard-route';
import { TodayHero } from './dashboard/today-hero';
import { OverviewGrid } from './dashboard/overview-grid';

export function DashboardHome({ setActiveView: propSetActiveView }) {
  const { navigateToView } = useDashboardRoute();
  const setActiveView = propSetActiveView || navigateToView;
  const { pantryId, lastInventoryUpdate, lastCatalogUpdate } = usePantry();
  
  // State
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState('7d');

  // Live: a teammate's change (realtime bumps lastInventoryUpdate / lastCatalogUpdate, also on wake-up
  // and reconnect) refetches the numbers quietly, keeping the current ones on screen meanwhile.
  // Only a new range dims the grid.
  const [shownRange, setShownRange] = useState(selectedRange);
  useEffect(() => {
    if (!pantryId) return;

    let isMounted = true;
    const fetchData = async () => {
      if (!stats) setLoading(true);
      else if (shownRange !== selectedRange) setGridLoading(true);

      try {
        const res = await fetch(`/api/dashboard/stats?range=${selectedRange}`, {
          headers: { 'x-pantry-id': pantryId },
          cache: 'no-store',
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setStats(data);
          setShownRange(selectedRange);
        }
      } catch (error) {
        console.error('Dashboard Stats Error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setGridLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
    // stats and shownRange only choose how to show the wait.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantryId, selectedRange, lastInventoryUpdate, lastCatalogUpdate]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-6 pb-24 md:px-8 space-y-4 font-sans">
      <WelcomeModal />

      {/* SECTION 1: TODAY HERO (OPEN CANVAS LAYOUT WITH INTRA-DAY TIMELINE & 2 STAT CARDS) */}
      <TodayHero 
        stats={stats} 
        loading={loading} 
        setActiveView={setActiveView} 
      />

      {/* SECTION 2: YOUR OVERVIEW GRID (STRIPE 3x2 CELL GRID WITH INTERACTIVE DATE RANGE FILTERING) */}
      <OverviewGrid 
        stats={stats} 
        loading={loading} 
        gridLoading={gridLoading}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        setActiveView={setActiveView} 
      />
    </div>
  );
}