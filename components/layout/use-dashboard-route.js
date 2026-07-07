'use client';

import { usePantry } from '@/components/providers/PantryProvider';
import { navItems } from '@/lib/constants';

export function useDashboardRoute(activeView) {
  const { pantryDetails } = usePantry();
  
  const showClientTracking = pantryDetails?.settings?.enable_client_tracking ?? true;
  
  const filteredNavItems = navItems.filter(item => 
    showClientTracking || item.view !== 'View Clients'
  );

  const isActive = (view) => activeView === view;

  return {
    showClientTracking,
    filteredNavItems,
    isActive,
  };
}
