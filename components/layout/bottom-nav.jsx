'use client';

import React from 'react';
import { LayoutDashboard, Boxes, Plus, MinusSquare, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardRoute } from './use-dashboard-route';

export function BottomNav({ activeView, setActiveView }) {
  const { isActive } = useDashboardRoute(activeView);

  const leftTabs = [
    { name: 'Home', label: 'Home', icon: LayoutDashboard, view: 'Dashboard' },
    { name: 'Inventory', label: 'Inventory', icon: Boxes, view: 'View Inventory' }
  ];

  const rightTabs = [
    { name: 'Remove', label: 'Remove', icon: MinusSquare, view: 'Remove Items' },
    { name: 'Recent', label: 'Recent', icon: History, view: 'Recent Changes' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[100] bg-[#fafaf8]/90 backdrop-blur-2xl border-t border-gray-200/50 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] flex items-center justify-evenly px-2 shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
      
      {leftTabs.map((tab) => {
        const active = isActive(tab.view);
        const TabIcon = tab.icon; 
        
        return (
          <button
            key={tab.name}
            onClick={() => setActiveView(tab.view)}
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
          </button>
        );
      })}

      {/* Center Add Button - Inline and balanced */}
      <button
        onClick={() => setActiveView('Add Items')}
        className="relative flex flex-col items-center justify-center w-16 pt-1"
      >
        <div className={cn(
          "h-10 w-10 rounded-[14px] flex items-center justify-center transition-all duration-200 -mt-1",
          isActive('Add Items')
            ? "bg-[#c06245] text-white scale-105 shadow-[0_4px_12px_-4px_rgba(217,119,87,0.5)]"
            : "bg-[#d97757] text-white hover:bg-[#c66547] shadow-sm"
        )}>
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <span className={cn(
          "text-[10px] mt-1 transition-all duration-200",
          isActive('Add Items') ? "text-[#c06245] font-semibold" : "text-[#d97757] font-medium"
        )}>
          Add
        </span>
      </button>

      {rightTabs.map((tab) => {
        const active = isActive(tab.view);
        const TabIcon = tab.icon; 
        
        return (
          <button
            key={tab.name}
            onClick={() => setActiveView(tab.view)}
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
          </button>
        );
      })}

    </div>
  );
}