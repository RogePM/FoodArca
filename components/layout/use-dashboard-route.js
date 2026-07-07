'use client';

import { usePantry } from '@/components/providers/PantryProvider';
import { navItems } from '@/lib/constants';

export function useDashboardRoute(activeView) {
  const { pantryDetails } = usePantry();
  
  const showClientTracking = false; // Client CRM removed from current scope
  
  const filteredNavItems = navItems.filter(item => item.view !== 'View Clients');

  const isActive = (view) => activeView === view;

  return {
    showClientTracking,
    filteredNavItems,
    isActive,
  };
}
