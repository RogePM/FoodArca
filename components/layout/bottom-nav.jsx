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

  const leftTabs = [
    { name: 'Home', label: 'Home', icon: Home, view: 'Dashboard', href: '/dashboard' },
    { name: 'Inventory', label: 'Inventory', icon: Package, view: 'View Inventory', href: '/dashboard/inventory' }
  ];

  const rightTabs = [
    { name: 'Remove', label: 'Remove', icon: MinusSquare, view: 'Remove Items', href: '/dashboard/remove' },
    { name: 'Workspace', label: 'Workspace', icon: UserCircle, view: 'Settings', href: '/dashboard/settings' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[100] bg-white backdrop-blur-2xl border-t border-gray-100 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] flex items-center justify-evenly px-2 shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
      
      {leftTabs.map((tab) => {
        const active = isActive(tab.href || tab.view);
        const TabIcon = tab.icon; 
        
        return (
          <Link
            key={tab.name}
            href={tab.href}
            onClick={() => handleNavClick(tab.view, tab.href)}
            className="relative flex flex-col items-center justify-center w-16 pt-1"
          >
            <div className={cn(
              "transition-all duration-200 flex items-center justify-center h-8",
              active ? "text-[#c06245] scale-110" : "text-gray-500 hover:text-gray-700"
            )}>
              <TabIcon className="h-[24px] w-[24px]" strokeWidth={active ? 2.5 : 2} />
            </div>
            
            <span className={cn(
              "text-[10px] mt-1 transition-all duration-200",
              active ? "text-[#c06245] font-semibold" : "text-gray-500 font-medium"
            )}>
              {tab.label}
            </span>
          </Link>
        );
      })}

      {/* Center Add Button - Soft Circle */}
      <Link
        href="/dashboard/add"
        onClick={() => handleNavClick('Add Items', '/dashboard/add')}
        className="relative flex flex-col items-center justify-center w-16 pt-1 group"
      >
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 -mt-1",
          isActive('Add Items')
            ? "bg-[#d97757]/20 text-[#c06245] scale-105"
            : "bg-[#d97757]/10 text-[#d97757] group-hover:bg-[#d97757]/20"
        )}>
          <Plus className="h-6 w-6" strokeWidth={isActive('Add Items') ? 2.5 : 2} />
        </div>
        <span className={cn(
          "text-[10px] mt-1 transition-all duration-200",
          isActive('Add Items') ? "text-[#c06245] font-semibold" : "text-[#d97757] font-medium"
        )}>
          Add
        </span>
      </Link>

      {rightTabs.map((tab) => {
        const active = isActive(tab.href || tab.view);
        const TabIcon = tab.icon; 
        
        return (
          <Link
            key={tab.name}
            href={tab.href}
            onClick={() => handleNavClick(tab.view, tab.href)}
            className="relative flex flex-col items-center justify-center w-16 pt-1"
          >
            <div className={cn(
              "transition-all duration-200 flex items-center justify-center h-8",
              active ? "text-[#c06245] scale-110" : "text-gray-500 hover:text-gray-700"
            )}>
              <TabIcon className="h-[24px] w-[24px]" strokeWidth={active ? 2.5 : 2} />
            </div>
            
            <span className={cn(
              "text-[10px] mt-1 transition-all duration-200",
              active ? "text-[#c06245] font-semibold" : "text-gray-500 font-medium"
            )}>
              {tab.label}
            </span>
          </Link>
        );
      })}

    </div>
  );
}