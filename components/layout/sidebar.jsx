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
        'group relative flex items-center w-full px-3.5 py-2.5 rounded-2xl text-sm transition-all duration-200 ease-in-out mb-1 border',
        isActive 
          ? 'bg-[#fff5f2] border-[#fce3da] shadow-[0_2px_8px_-2px_rgba(217,119,87,0.12)] font-semibold' 
          : 'text-gray-500 hover:bg-gray-100/70 hover:text-gray-900 border-transparent font-medium'
      )}
    >
      {/* Icon Container (White Background with Brand Orange Icon Lines) */}
      <div className={cn(
        "mr-3 h-8.5 w-8.5 rounded-xl flex items-center justify-center transition-all duration-300",
        isActive 
          ? "bg-white border border-[#fcd5c7] text-[#d97757] shadow-2xs" 
          : "text-gray-400 group-hover:bg-white group-hover:text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      )}>
        <item.icon className={cn("h-4.5 w-4.5", isActive ? "text-[#d97757]" : "text-gray-400 group-hover:text-gray-700")} strokeWidth={isActive ? 2.2 : 1.5} />
      </div>
      
      {/* Label (Bolded Brand Orange Text when Active) */}
      <span className={cn(
        "flex-1 text-left transition-all duration-200 tracking-tight text-[14.5px]",
        isActive 
          ? "font-bold text-[#d97757]" 
          : "font-medium text-gray-600 group-hover:text-gray-900"
      )}>
        {item.name}
      </span>

      {/* Glowing Orange Active Indicator Dot */}
      {isActive && (
        <motion.div 
          layoutId="active-pill" 
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-2 w-2 rounded-full bg-[#d97757] shadow-[0_0_8px_rgba(217,119,87,0.6)] mr-1" 
        />
      )}
    </button>
  );
};

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
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white border-r border-gray-200/80 transition-transform duration-300 ease-out',
          'md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* --- HEADER --- */}
        <div className="flex h-[72px] items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#d97757] to-[#c06245] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <Leaf className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-gray-900">
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