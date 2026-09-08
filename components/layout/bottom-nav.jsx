'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Package, Plus, MinusSquare, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardRoute } from './use-dashboard-route';

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
    { name: 'Home', label: 'Home', icon: Home, view: 'Dashboard', href: '/dashboard' },
    { name: 'Add', label: 'Add', icon: Plus, view: 'Add Items', href: '/dashboard/add' },
    { name: 'Inventory', label: 'Inventory', icon: Package, view: 'View Inventory', href: '/dashboard/inventory' },
    { name: 'Remove', label: 'Remove', icon: MinusSquare, view: 'Remove Items', href: '/dashboard/remove' },
    { name: 'Workspace', label: 'Workspace', icon: UserCircle, view: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[100] bg-white/80 backdrop-blur-xl pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] flex items-center justify-evenly px-3 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-8px_24px_rgba(0,0,0,0.03)]">
      
      {tabs.map((tab) => {
        const active = isActive(tab.href || tab.view);
        const TabIcon = tab.icon; 
        
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
              active ? "text-[#1a1f36]" : "text-gray-400 hover:text-gray-600"
            )}>
              <TabIcon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 1.75} />
            </div>
            
            <span className={cn(
              "text-[10px] mt-0.5 transition-all duration-300 tracking-wide",
              active 
                ? "text-[#1a1f36] font-semibold" 
                : "text-gray-400 font-medium"
            )}>
              {tab.label}
            </span>
          </Link>
        );
      })}

    </div>
  );
}