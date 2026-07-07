'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, X, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@supabase/ssr';
import { usePantry } from '@/components/providers/PantryProvider';
import { useDashboardRoute } from './use-dashboard-route';

// --- NAV ITEM COMPONENT ---
const NavItem = ({ item, isActive, onClick, elementId }) => {
  return (
<button
      id={elementId}
      onClick={onClick}
      className={cn(
        'group relative flex items-center w-full px-3 py-2.5 rounded-2xl text-sm transition-all duration-200 ease-in-out mb-1 border',
        isActive 
          ? 'bg-white shadow-[0_4px_14px_-6px_rgba(0,0,0,0.08)] border-[#f0ebe7]' 
          : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-900 border-transparent'
      )}
    >
      {/* Icon Container - Brought the orange back elegantly */}
      <div className={cn(
        "mr-3 h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300",
        isActive 
          // Uses a soft translucent background with the strong brand color and a subtle matching shadow
          ? "bg-[#d97757]/10 text-[#d97757] shadow-sm shadow-[#d97757]/10" 
          : "text-gray-400 group-hover:bg-white group-hover:text-gray-600 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      )}>
        <item.icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.5 : 1.5} />
      </div>
      
      {/* Label - Made more elegant with dynamic font weights */}
      <span className={cn(
        "flex-1 text-left transition-all duration-200",
        isActive 
          ? "font-semibold tracking-normal text-gray-900" // Crisper, slightly bolder when active
          : "font-medium tracking-tight" // Softer and tighter when inactive
      )}>
        {item.name}
      </span>

      {/* The Ball Animation */}
      {isActive && (
        <motion.div 
          layoutId="active-pill" 
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-2 w-2 rounded-full bg-[#d97757] shadow-[0_0_8px_rgba(217,119,87,0.5)] mr-1" 
        />
      )}
    </button>
  );
};

// ... (Keep your NavItem component exactly as it is) ...

export function Sidebar({ activeView, setActiveView, isSidebarOpen, setIsSidebarOpen }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { filteredNavItems, isActive } = useDashboardRoute(activeView);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleNavClick = (view) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          // FIX 1: Changed w-64 to w-[280px] to close the gap
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#fbfbfa]/95 backdrop-blur-xl border-r border-gray-100/50 transition-transform duration-300 ease-out shadow-[1px_0_2px_rgba(0,0,0,0.02)]',
          'md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* --- HEADER --- */}
        {/* FIX 2: Changed h-16 to h-[72px] to perfectly align with TopBar */}
        <div className="flex h-[72px] items-center px-6 border-b border-gray-100/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#d97757] to-[#c06245] text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
                <Leaf className="h-4.5 w-4.5" strokeWidth={2} />
            </div>
            <span className="text-xl font-serif font-semibold tracking-tight text-gray-900">
                Food Arca
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-4 md:hidden text-gray-400 hover:text-gray-900"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* --- NAVIGATION --- */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-2 mb-3">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Management
            </h3>
          </div>
          
          {filteredNavItems.map((item) => (
            <NavItem 
              key={item.name} 
              item={item} 
              isActive={isActive(item.view)}
              onClick={() => handleNavClick(item.view)}
            />
          ))}
        </nav>

        {/* --- FOOTER --- */}
        <div className="p-4 border-t border-gray-100/50">
          <div className="space-y-1">
            <NavItem 
                item={{ name: 'Settings', icon: Settings, view: 'Settings' }} 
                isActive={isActive('Settings')}
                onClick={() => handleNavClick('Settings')}
                elementId="sidebar-settings-btn"
            />
            
            <button
              onClick={handleSignOut}
              className="group flex items-center w-full px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <div className="mr-3 h-8 w-8 rounded-lg flex items-center justify-center transition-colors group-hover:bg-red-100/50">
                <LogOut className="h-4.5 w-4.5" strokeWidth={1.5} />
              </div>
              <span className="tracking-tight">Log out</span>
            </button>
          </div>
          
          <div className="mt-4 px-3 text-[11px] text-gray-300 font-medium">
             v1.2.0 &copy; 2026
          </div>
        </div>
      </aside>
    </>
  );
}