'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';
import { BottomNav } from './bottom-nav';

export function DashboardLayout({ activeView, setActiveView, children }) {
  return (
    // Outer wrapper uses 100dvh
    <div className="min-h-[100dvh] w-full bg-[#fafafa] text-gray-900 flex overflow-hidden">      
      
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
        <TopBar
          activeView={activeView}
          setActiveView={setActiveView} 
        />
        
        {/* Spacer: Height of bottom-nav + safe-area on mobile, standard padding on desktop */}
        <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto pb-[calc(90px+env(safe-area-inset-bottom))] md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {/* We removed the onMenuClick prop because the overlay is gone */}
      <BottomNav 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />

    </div>
  );
}