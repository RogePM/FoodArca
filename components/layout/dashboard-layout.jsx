'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';
import { BottomNav } from './bottom-nav';
import { useDashboardRoute } from './use-dashboard-route';

export function DashboardLayout({ activeView: propActiveView, setActiveView: propSetActiveView, children }) {
  const { activeView: routeActiveView, navigateToView } = useDashboardRoute(propActiveView);
  const activeView = propActiveView || routeActiveView;
  const setActiveView = propSetActiveView || navigateToView;

  return (
    // Outer wrapper uses 100dvh
    <div className="min-h-[100dvh] w-full bg-white md:bg-[#fafafa] text-gray-900 flex overflow-hidden">      
      
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden md:block">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isSidebarOpen={true}
          setIsSidebarOpen={() => {}} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-[280px] transition-all duration-300 ease-in-out h-[100dvh]">
        {/* TopBar is completely hidden on mobile to maximize screen real estate and act like a native app. */}
        <div className="hidden md:block">
          <TopBar
            activeView={activeView}
            setActiveView={setActiveView} 
          />
        </div>
        
        {/* Spacer: Height of bottom-nav + safe-area on mobile, standard padding on desktop */}
        <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto pb-[calc(90px+env(safe-area-inset-bottom))] md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />

    </div>
  );
}