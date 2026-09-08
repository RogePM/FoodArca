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
    { name: 'Add', label: 'Add', icon: Plus, view: 'Add Items', href: '/dashboard/add', isAdd: true },
    { name: 'Inventory', label: 'Inventory', icon: Package, view: 'View Inventory', href: '/dashboard/inventory' },
    { name: 'Remove', label: 'Remove', icon: MinusSquare, view: 'Remove Items', href: '/dashboard/remove' },
    { name: 'Workspace', label: 'Workspace', icon: UserCircle, view: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[100] bg-white/95 backdrop-blur-2xl border-t border-gray-100 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] flex items-center justify-evenly px-2 shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
      
      {tabs.map((tab) => {
        const active = isActive(tab.href || tab.view);
        const TabIcon = tab.icon; 
        
        return (
          <Link
            key={tab.name}
            href={tab.href}
            onClick={() => handleNavClick(tab.view, tab.href)}
            className={cn(
              "relative flex flex-col items-center justify-center w-14 pt-0.5",
              tab.isAdd && "group"
            )}
          >
            {tab.isAdd ? (
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200",
                active
                  ? "bg-[#d97757]/20 text-[#c06245] scale-105"
                  : "bg-[#d97757]/10 text-[#d97757] group-hover:bg-[#d97757]/20"
              )}>
                <TabIcon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </div>
            ) : (
              <div className={cn(
                "transition-all duration-200 flex items-center justify-center h-6",
                active ? "text-[#c06245] scale-110" : "text-gray-500 hover:text-gray-700"
              )}>
                <TabIcon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </div>
            )}
            
            <span className={cn(
              "text-[10px] mt-0.5 transition-all duration-200",
              tab.isAdd
                ? (active ? "text-[#c06245] font-semibold" : "text-[#d97757] font-medium")
                : (active ? "text-[#c06245] font-semibold" : "text-gray-500 font-medium")
            )}>
              {tab.label}
            </span>
          </Link>
        );
      })}

    </div>
  );
}