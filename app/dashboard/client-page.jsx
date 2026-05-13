'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardHome } from '@/components/pages/dashboard-home';
import { AddItemView } from '@/components/pages/add-items/add-item-view';
import { RecentChangesView } from '@/components/pages/recent-changes-view';
import { InventoryView } from '@/components/pages/Full-inventory';
import { ClientListView } from '@/components/pages/ClientDirectory';
import { usePantry } from '@/components/providers/PantryProvider';
import { SettingsView } from '@/components/pages/settings-view';
import { DistributionView } from '@/components/pages/distribution-view';

export default function DashboardClientApp({ initialUser, initialPantryId }) {
  const [activeView, setActiveView] = useState('Dashboard');
  const { isLoading: isPantryLoading } = usePantry();

  // Log the initial data we received from the server
  useEffect(() => {
    console.log('✅ Client: Received user data:', initialUser);
    console.log('✅ Client: Pantry ID:', initialPantryId);
  }, [initialUser, initialPantryId]);

  // 1. URL Persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveView(decodeURIComponent(hash));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = activeView;
    }
  }, [activeView]);

  // Animations
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  // View Router
  const renderView = () => {
    // Show loading only while fetching Pantry ID (not Auth session)
    if (isPantryLoading) {
      return (
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
          Loading organization data...
        </div>
      );
    }

    // If no pantry ID, show onboarding message
    if (!initialPantryId && !isPantryLoading) {
      return (
        <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground">
          <p className="text-lg mb-4">No organization found.</p>
          <p className="text-sm">Please complete onboarding or contact support.</p>
        </div>
      );
    }

    switch (activeView) {
      case 'Dashboard': return <DashboardHome setActiveView={setActiveView} />;
      case 'Add Items': return <AddItemView />;
      case 'Remove Items': return <DistributionView/>;
      case 'View Inventory': return <InventoryView />;
      case 'Recent Changes': return <RecentChangesView />;
      case 'View Clients': return <ClientListView />;
      case 'Settings': return <SettingsView />;
      default: return <DashboardHome setActiveView={setActiveView} />;
    }
  };

  return (
    <DashboardLayout activeView={activeView} setActiveView={setActiveView}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: 'tween', duration: 0.3 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}