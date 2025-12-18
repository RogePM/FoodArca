'use client';

import React, { useEffect, useState } from 'react';
import { 
  Menu, ChevronDown, Copy, Check, MapPin, 
  Building2, LogOut, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { usePantry } from '@/components/providers/PantryProvider';
import { createBrowserClient } from '@supabase/ssr';

export function TopBar({ activeView, onMenuClick }) {
  const { 
    pantryId, 
    pantryDetails, 
    availablePantries, 
    switchPantry, 
    isLoading 
  } = usePantry();
  
  const [userData, setUserData] = useState({ name: '', email: '', avatarUrl: '' });
  const [isCopied, setIsCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    setIsMounted(true);
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserData({
            name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
            email: user.email,
            avatarUrl: user.user_metadata?.avatar_url || ''
        });
      }
    };
    fetchUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleCopyCode = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pantryDetails?.join_code) { 
      navigator.clipboard.writeText(pantryDetails.join_code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : 'U';

  if (!isMounted) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl md:px-6">
            <div className="h-5 w-32 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse"></div>
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl md:px-6 transition-all">
      
      {/* --- LEFT: Breadcrumb Area --- */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-500 hover:bg-gray-100"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="hidden md:flex items-center text-sm font-medium">
          <span className="text-gray-400">Dashboard</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-900 bg-gray-100/50 px-2 py-0.5 rounded-md">
            {activeView}
          </span>
        </div>
        
        <span className="md:hidden font-semibold text-gray-900">{activeView}</span>
      </div>
      
      {/* --- RIGHT: Controls --- */}
      <div className="flex items-center gap-3">
        
        {/* 1. ORGANIZATION SWITCHER */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 py-1.5 px-2 pl-2 pr-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all outline-none group shadow-sm">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-[#d97757] border border-orange-100">
                        {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Building2 className="h-3 w-3" />}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 max-w-[100px] truncate">
                        {isLoading ? 'Loading...' : (pantryDetails?.name || 'Select')}
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-72 p-2 rounded-xl shadow-lg border-gray-100/80 bg-white/95 backdrop-blur-sm mt-1">
                
                {/* Active Org Card */}
                <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100 mb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-sm text-gray-900 leading-none mb-1">
                                {pantryDetails?.name}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                <MapPin className="h-3 w-3" />
                                {pantryDetails?.address || 'No location set'}
                            </div>
                        </div>
                        {pantryDetails?.join_code && (
                             <button 
                                onClick={handleCopyCode}
                                className="group/code flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2 py-1 hover:border-[#d97757]/30 transition-colors"
                             >
                                <code className="text-[10px] font-mono font-bold text-gray-600 group-hover/code:text-[#d97757]">
                                    {pantryDetails.join_code}
                                </code>
                                {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                             </button>
                        )}
                    </div>
                </div>
                
                <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pb-1">
                    Your Organization
                </DropdownMenuLabel>

                {/* --- ENTERPRISE READY: Loop through pantries --- */}
                <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                    {availablePantries.map((membership) => {
                        const isSelected = membership.pantry_id === pantryId;
                        return (
                            <DropdownMenuItem 
                                key={membership.pantry_id}
                                onClick={() => switchPantry(membership.pantry_id)}
                                className={`cursor-pointer rounded-md py-2 px-2 flex items-center justify-between ${isSelected ? 'bg-orange-50' : ''}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`h-8 w-8 rounded-md flex items-center justify-center border shrink-0 ${isSelected ? 'bg-white border-orange-100 text-[#d97757]' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className={`font-medium text-sm truncate ${isSelected ? 'text-[#d97757]' : 'text-gray-700'}`}>
                                            {membership.pantry.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 capitalize truncate">
                                            {membership.role}
                                        </span>
                                    </div>
                                </div>
                                {isSelected && <Check className="h-3.5 w-3.5 text-[#d97757]" />}
                            </DropdownMenuItem>
                        );
                    })}
                </div>
                
                {/* 🔥 REMOVED: "Create Organization" button is gone. */}
                
            </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. USER PROFILE */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-transparent focus-visible:ring-0 outline-none">
                    <Avatar className="h-8 w-8 border border-gray-200 shadow-sm transition-transform hover:scale-105">
                        <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-medium text-xs">
                            {getInitials(userData.name)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-gray-100 p-1 mt-1">
                <div className="px-3 py-2.5 bg-gray-50/50 rounded-lg mb-1">
                    <p className="text-sm font-semibold text-gray-900">{userData.name}</p>
                    <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                </div>
                
                <DropdownMenuItem 
                    className="cursor-pointer rounded-md focus:bg-red-50 text-red-600 text-sm py-2 px-3"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}