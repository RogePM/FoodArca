'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDashboardRoute } from './use-dashboard-route';

// Outline icons (inactive state)
import {
  HomeIcon as HomeOutline,
  ArchiveBoxIcon as InventoryOutline,
  PlusCircleIcon as AddOutline,
  MinusCircleIcon as RemoveOutline,
  UserCircleIcon as WorkspaceOutline,
} from '@heroicons/react/24/outline';

// Solid/filled icons (active state)
import {
  HomeIcon as HomeSolid,
  ArchiveBoxIcon as InventorySolid,
  PlusCircleIcon as AddSolid,
  MinusCircleIcon as RemoveSolid,
  UserCircleIcon as WorkspaceSolid,
} from '@heroicons/react/24/solid';

export function BottomNav({ activeView, setActiveView }) {
  const { isActive, navigateToView } = useDashboardRoute(activeView);

  const handleNavClick = (view, href) => {
    if (setActiveView && setActiveView !== navigateToView) {
      setActiveView(view);
    } else if (!href && navigateToView) {
      navigateToView(view);
    }
  };

  const tabs = [
    { name: 'Home', label: 'Home', outline: HomeOutline, solid: HomeSolid, view: 'Dashboard', href: '/dashboard' },
    { name: 'Add', label: 'Add', outline: AddOutline, solid: AddSolid, view: 'Add Items', href: '/dashboard/add' },
    { name: 'Inventory', label: 'Inventory', outline: InventoryOutline, solid: InventorySolid, view: 'View Inventory', href: '/dashboard/inventory' },
    { name: 'Remove', label: 'Remove', outline: RemoveOutline, solid: RemoveSolid, view: 'Remove Items', href: '/dashboard/remove' },
    { name: 'Workspace', label: 'Workspace', outline: WorkspaceOutline, solid: WorkspaceSolid, view: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[100] bg-white/80 backdrop-blur-xl pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] flex items-center justify-evenly px-3 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-8px_24px_rgba(0,0,0,0.03)]">
      
      {tabs.map((tab) => {
        const active = isActive(tab.href || tab.view);
        const Icon = active ? tab.solid : tab.outline;
        
        return (
          <Link
            key={tab.name}
            href={tab.href}
            onClick={() => handleNavClick(tab.view, tab.href)}
            className="relative flex flex-col items-center justify-center w-14 pt-0.5"
          >
            {/* Active pill indicator */}
            {active && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-[#c06245]" />
            )}

            <div className={cn(
              "transition-all duration-300 ease-out flex items-center justify-center h-6",
              active ? "text-[#c06245]" : "text-gray-500 hover:text-gray-600"
            )}>
              <Icon className="h-[22px] w-[22px]" />
            </div>
            
            <span className={cn(
              "text-[10px] mt-0.5 transition-all duration-300 tracking-wide",
              active 
                ? "text-[#c06245] font-semibold" 
                : "text-gray-500 font-medium"
            )}>
              {tab.label}
            </span>
          </Link>
        );
      })}

    </div>
  );
}