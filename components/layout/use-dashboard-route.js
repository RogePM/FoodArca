'use client';

import { usePathname, useRouter } from 'next/navigation';
import { usePantry } from '@/components/providers/PantryProvider';
import { navItems } from '@/lib/constants';

const viewToPath = {
  'Dashboard': '/dashboard',
  'Overview': '/dashboard',
  'Add Items': '/dashboard/add',
  'View Add Items': '/dashboard/add',
  'Remove Items': '/dashboard/remove',
  'View Distribution': '/dashboard/remove',
  'Distribution': '/dashboard/remove',
  'View Inventory': '/dashboard/inventory',
  'Inventory': '/dashboard/inventory',
  'Recent Changes': '/dashboard/recent',
  'Recent': '/dashboard/recent',
  'Settings': '/dashboard/settings',
};

const pathToView = {
  '/dashboard': 'Dashboard',
  '/dashboard/add': 'Add Items',
  '/dashboard/remove': 'Remove Items',
  '/dashboard/inventory': 'View Inventory',
  '/dashboard/recent': 'Recent Changes',
  '/dashboard/settings': 'Settings',
};

export function getActiveViewFromPathname(pathname) {
  if (!pathname) return 'Dashboard';
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/dashboard/add')) return 'Add Items';
  if (pathname.startsWith('/dashboard/remove')) return 'Remove Items';
  if (pathname.startsWith('/dashboard/inventory')) return 'View Inventory';
  if (pathname.startsWith('/dashboard/recent')) return 'Recent Changes';
  if (pathname.startsWith('/dashboard/settings')) return 'Settings';
  return 'Dashboard';
}

export function useDashboardRoute(explicitActiveView) {
  const pathname = usePathname();
  const router = useRouter();
  const { pantryDetails } = usePantry();
  
  const showClientTracking = false; // Client CRM removed from current scope
  
  const filteredNavItems = navItems.filter(item => item.view !== 'View Clients');

  const currentView = explicitActiveView || getActiveViewFromPathname(pathname);

  const isActive = (viewOrPath) => {
    if (!viewOrPath) return false;
    if (viewOrPath === 'Dashboard' || viewOrPath === '/dashboard') {
      return pathname === '/dashboard' || (!pathname.startsWith('/dashboard/') && currentView === 'Dashboard');
    }
    if (viewOrPath === 'Add Items' || viewOrPath === '/dashboard/add' || viewOrPath === 'View Add Items') {
      return pathname === '/dashboard/add' || pathname.startsWith('/dashboard/add/') || currentView === 'Add Items';
    }
    if (viewOrPath === 'Remove Items' || viewOrPath === '/dashboard/remove' || viewOrPath === 'View Distribution' || viewOrPath === 'Distribution') {
      return pathname === '/dashboard/remove' || pathname.startsWith('/dashboard/remove/') || currentView === 'Remove Items';
    }
    if (viewOrPath === 'View Inventory' || viewOrPath === '/dashboard/inventory' || viewOrPath === 'Inventory') {
      return pathname === '/dashboard/inventory' || pathname.startsWith('/dashboard/inventory/') || currentView === 'View Inventory';
    }
    if (viewOrPath === 'Recent Changes' || viewOrPath === '/dashboard/recent' || viewOrPath === 'Recent') {
      return pathname === '/dashboard/recent' || pathname.startsWith('/dashboard/recent/') || currentView === 'Recent Changes';
    }
    if (viewOrPath === 'Settings' || viewOrPath === '/dashboard/settings') {
      return pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/') || currentView === 'Settings';
    }
    return currentView === viewOrPath || pathname === viewOrPath;
  };

  const navigateToView = (viewOrPath) => {
    if (!viewOrPath) return;
    if (viewOrPath.startsWith('/')) {
      router.push(viewOrPath);
    } else if (viewToPath[viewOrPath]) {
      router.push(viewToPath[viewOrPath]);
    } else {
      router.push('/dashboard');
    }
  };

  return {
    pathname,
    activeView: currentView,
    showClientTracking,
    filteredNavItems,
    isActive,
    navigateToView,
  };
}
