'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';

export function DashboardLayout({ activeView, setActiveView, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#fafafa] text-gray-900 flex">
      
      {/* Fixed Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      {/* FIX 1: Ensure md:pl-64 matches Sidebar width exactly */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300 ease-in-out">
        <TopBar
          activeView={activeView}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        {/* FIX 2: REMOVED padding (p-4 md:p-6). 
           We removed the padding here so your Directory page's 
           white background touches the edges correctly without a gray gap. 
        */}
        <main className="flex-1 overflow-x-hidden">
          {/* We keeps max-w-7xl here if you want ALL pages to be centered, 
              OR remove it if you want full-width pages. 
              Given your Directory code has its own max-w-7xl, 
              we can actually remove this div wrapper entirely 
              or just render children directly.
          */}
          {children}
        </main>
      </div>

    </div>
  );
}