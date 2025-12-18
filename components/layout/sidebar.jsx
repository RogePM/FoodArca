'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, X, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@supabase/ssr';
import { usePantry } from '@/components/providers/PantryProvider';

// --- NAV ITEM COMPONENT ---
const NavItem = ({ item, isActive, onClick, elementId }) => {
  return (
    <button
      id={elementId}
      onClick={onClick}
      className={cn(
        'group relative flex items-center w-full p-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out mb-1',
        isActive 
          ? 'bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-gray-900' 
          : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-900'
      )}
    >
      {/* Icon Container */}
      <div className={cn(
        "mr-3 h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-200",
        isActive 
          ? "bg-[#d97757]/10 text-[#d97757]" 
          : "text-gray-400 group-hover:bg-white group-hover:text-gray-600"
      )}>
        <item.icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2 : 1.5} />
      </div>
      
      {/* Label */}
      <span className="flex-1 text-left tracking-tight">{item.name}</span>

      {/* 🔥 THE BALL ANIMATION IS BACK! */}
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

export function Sidebar({ activeView, setActiveView, isSidebarOpen, setIsSidebarOpen }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { pantryDetails } = usePantry();

  // Filter Logic
  const showClientTracking = pantryDetails?.settings?.enable_client_tracking ?? true;
  const filteredNavItems = navItems.filter(item => 
    showClientTracking || item.view !== 'View Clients'
  );

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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#fcfcfc] border-r border-gray-100 transition-transform duration-300 ease-out shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]',
          'md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* --- HEADER --- */}
        <div className="flex h-16 items-center px-5 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
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
            className="absolute right-3 top-3.5 md:hidden text-gray-400 hover:text-gray-900"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* --- NAVIGATION --- */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          <div className="px-3 mb-2">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Management
            </h3>
          </div>
          
          {filteredNavItems.map((item) => (
            <NavItem 
              key={item.name} 
              item={item} 
              isActive={activeView === item.view}
              onClick={() => handleNavClick(item.view)}
            />
          ))}
        </nav>

        {/* --- FOOTER --- */}
        <div className="p-3 border-t border-gray-100 bg-white/50">
          <div className="space-y-1">
            <NavItem 
                item={{ name: 'Settings', icon: Settings, view: 'Settings' }} 
                isActive={activeView === 'Settings'}
                onClick={() => handleNavClick('Settings')}
                elementId="sidebar-settings-btn"
            />
            
            <button
              onClick={handleSignOut}
              className="group flex items-center w-full p-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <div className="mr-3 h-8 w-8 rounded-lg flex items-center justify-center transition-colors group-hover:bg-red-100/50">
                <LogOut className="h-4.5 w-4.5" strokeWidth={1.5} />
              </div>
              <span className="tracking-tight">Log out</span>
            </button>
          </div>
          
          <div className="mt-4 px-3 text-[10px] text-gray-300 font-medium">
             v1.2.0 &copy; 2025
          </div>
        </div>
      </aside>
    </>
  );
}