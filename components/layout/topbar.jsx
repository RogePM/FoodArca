'use client';

import React, { useEffect, useState } from 'react';
import {
    Menu, ChevronDown, Copy, Check, MapPin, Settings, Leaf,
    Building2, LogOut, RefreshCw, Bell, AlertTriangle, ArrowUpCircle, Package, X as XIcon, CreditCard, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { usePantry } from '@/components/providers/PantryProvider';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';

export function TopBar({ activeView, onMenuClick, setActiveView }) {
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
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dismissedIds, setDismissedIds] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasSeenAlerts, setHasSeenAlerts] = useState(false);

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

        if (pantryId) {
            const savedDismissed = JSON.parse(localStorage.getItem(`dismissed-alerts-${pantryId}`) || '[]');
            setDismissedIds(savedDismissed);
        }
    }, [supabase, pantryId]);

    useEffect(() => {
        if (!pantryId) return;

        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications', {
                    headers: { 'x-pantry-id': pantryId }
                });

                if (res.ok) {
                    const data = await res.json();
                    const allAlerts = data.alerts || [];
                    const activeAlerts = allAlerts.filter(alert => !dismissedIds.includes(alert.id));

                    setNotifications(activeAlerts);
                    setUnreadCount(activeAlerts.length);

                    const lastSeenCount = parseInt(localStorage.getItem(`notif-count-${pantryId}`) || '0');
                    if (activeAlerts.length > lastSeenCount) {
                        setHasSeenAlerts(false);
                    } else {
                        setHasSeenAlerts(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);

    }, [pantryId, dismissedIds]);

    const handleDismiss = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        localStorage.setItem(`dismissed-alerts-${pantryId}`, JSON.stringify(newDismissed));
    };

    const handleOpenChange = (isOpen) => {
        setIsNotifOpen(isOpen);
        if (isOpen) {
            setHasSeenAlerts(true);
            localStorage.setItem(`notif-count-${pantryId}`, unreadCount.toString());
        }
    };

    const handleNotificationClick = (notification) => {
        setIsNotifOpen(false);
        if (notification.targetView && setActiveView) {
            setActiveView(notification.targetView);
        } else if (notification.action === 'billing' && setActiveView) {
            setActiveView('Settings');
        }
        if (notification.action === 'billing' || notification.id?.includes('limit')) {
            window.location.hash = 'billing';
        }
    };

    const getAlertIcon = (type, id) => {
        if (id.includes('expiry') || id.includes('expired')) return Package;
        if (type === 'critical') return ArrowUpCircle;
        return AlertTriangle;
    };

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
            <header className="sticky top-0 z-30 flex h-[72px] w-full items-center justify-between border-b border-gray-100 bg-[#fafaf8]/80 px-4 backdrop-blur-2xl md:px-6">
                <div className="h-5 w-32 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse"></div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-30 flex h-[72px] w-full items-center justify-between border-b border-gray-200/50 bg-[#fafaf8]/80 px-4 backdrop-blur-2xl md:px-8 transition-all">

            {/* --- LEFT: App Logo (Mobile) / Context (Desktop) --- */}
            <div className="flex items-center gap-3">
                {/* Desktop Context (Hidden on mobile) */}
                <div className="hidden md:flex items-center text-[15px] font-medium">
                    <span className="text-gray-400">Dashboard</span>
                    <span className="mx-2 text-gray-300">/</span>
                    <span className="text-[#2b2b2b] bg-white/60 px-3 py-1.5 rounded-lg border border-gray-200/30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                        {activeView}
                    </span>
                </div>

                {/* Mobile App Logo */}
                <div className="flex md:hidden items-center gap-2.5">
                    <div className="h-[34px] w-[34px] rounded-lg bg-gradient-to-br from-[#d97757] to-[#c06245] text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
                        <Leaf className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <span className="text-[19px] font-serif font-semibold tracking-tight text-gray-900">
                        Food Arca
                    </span>
                </div>
            </div>

            {/* --- RIGHT: Controls --- */}
            <div className="flex items-center gap-2 md:gap-4">

                {/* 1. ORGANIZATION SWITCHER (Desktop Only) */}
                <div className="hidden md:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 py-1.5 px-2 pl-2 pr-3 rounded-full border border-gray-200/60 bg-white/80 hover:bg-white hover:border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all outline-none group active:scale-95 duration-200">
                                <div className="h-6 w-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                                    {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Building2 className="h-3 w-3" />}
                                </div>
                                <span className="text-sm font-medium tracking-tight text-gray-700 max-w-[120px] truncate">
                                    {isLoading ? 'Loading...' : (pantryDetails?.name || 'Select')}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border-gray-100/50 bg-white/95 backdrop-blur-sm mt-2">
                            <DropdownMenuItem className="p-0 focus:bg-transparent outline-none mb-2" onClick={() => setActiveView && setActiveView('Settings')}>
                                <div className="w-full bg-gray-50/80 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group/card">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900 leading-none mb-1 group-hover/card:text-[#2b2b2b] transition-colors">
                                                {pantryDetails?.name}
                                            </p>
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <MapPin className="h-3 w-3" />
                                                {pantryDetails?.address || 'No location set'}
                                            </div>
                                        </div>
                                        {pantryDetails?.join_code && (
                                            <button onClick={handleCopyCode} className="group/code flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 hover:border-gray-300 transition-colors shadow-sm">
                                                <code className="text-[10px] font-mono font-bold text-gray-600">
                                                    {pantryDetails.join_code}
                                                </code>
                                                {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pb-1">
                                Your Organization
                            </DropdownMenuLabel>

                            <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                                {availablePantries.map((membership) => {
                                    const isSelected = membership.pantry_id === pantryId;
                                    return (
                                        <DropdownMenuItem key={membership.pantry_id} onClick={() => switchPantry(membership.pantry_id)} className={`cursor-pointer rounded-lg py-2 px-2 flex items-center justify-between transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${isSelected ? 'bg-white border-gray-200 text-gray-800 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className={`font-medium text-sm truncate ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {membership.pantry.name}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && <Check className="h-3.5 w-3.5 text-gray-800" />}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* 2. NOTIFICATIONS BELL */}
                <DropdownMenu open={isNotifOpen} onOpenChange={handleOpenChange}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-900 hover:bg-gray-100/60 rounded-full h-10 w-10 transition-transform active:scale-95">
                            <Bell className="h-5 w-5" strokeWidth={1.5} />
                            {unreadCount > 0 && !hasSeenAlerts && (
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-[1.5px] border-white shadow-sm" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    
                    {/* CHANGED: Reverted to a fixed readable width, and we'll let Radix handle the bounds naturally */}
                    <DropdownMenuContent align="end" className="w-[340px] sm:w-[380px] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-gray-100/50 p-0 mt-2 overflow-hidden ring-1 ring-black/5 bg-white/95 backdrop-blur-xl">
                        <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-white/50">
                            <span className="font-semibold text-[16px] text-gray-900 tracking-tight">Notifications</span>
                            {notifications.length > 0 && (
                                <span className="bg-[#d97757]/10 text-[#d97757] text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                                    {notifications.length} New
                                </span>
                            )}
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50/30">
                                    <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                    <p className="text-[15px] font-medium text-gray-500">All caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    <AnimatePresence>
                                        {notifications.map((notif) => {
                                            const Icon = getAlertIcon(notif.type, notif.id);
                                            const isCritical = notif.type === 'critical';
                                            return (
                                                <motion.div
                                                    key={notif.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-4 hover:bg-gray-50/80 cursor-pointer transition-colors relative group"
                                                    onClick={() => handleNotificationClick(notif)}
                                                >
                                                    <div className="flex gap-4 items-start">
                                                        {/* CHANGED: Made the icon square large and readable again! */}
                                                        <div className={`mt-0.5 h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                                                            <Icon className="h-5 w-5" strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-6">
                                                            <p className="text-[15px] font-semibold text-gray-900 leading-tight mb-1">
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-[13.5px] text-gray-500 leading-snug line-clamp-2">
                                                                {notif.message}
                                                            </p>
                                                            {notif.item && (
                                                                <p className="text-[11.5px] font-bold text-[#d97757] mt-2 bg-[#d97757]/10 inline-block px-2.5 py-1 rounded-md tracking-tight uppercase">
                                                                    {notif.item}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button 
                                                            onClick={(e) => handleDismiss(e, notif.id)}
                                                            className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                                                        >
                                                            <XIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* 3. USER PROFILE (Moved all the way to the right for both mobile and desktop) */}
                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-0 outline-none ml-1">
                                <Avatar className="h-9 w-9 border border-gray-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-transform hover:scale-105">
                                    <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                                    <AvatarFallback className="bg-[#2b2b2b] text-white font-medium text-xs tracking-wide">
                                        {getInitials(userData.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-gray-100/50 p-1 mt-2 bg-white/95 backdrop-blur-xl">
                            <div className="px-3 py-3 bg-gray-50/50 rounded-xl mb-2 border border-gray-100/50">
                                <p className="text-sm font-semibold text-gray-900">{userData.name}</p>
                                <p className="text-[12px] text-gray-500 truncate">{userData.email}</p>
                            </div>
                            
                            {/* Settings moved here! */}
                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg text-gray-700 text-sm py-2.5 px-3 font-medium transition-colors"
                                onClick={() => setActiveView && setActiveView('Settings')}
                            >
                                <Settings className="mr-2 h-4 w-4 text-gray-400" /> Settings
                            </DropdownMenuItem>

                            <div className="h-[1px] bg-gray-100 my-1 mx-2" />

                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg focus:bg-red-50 text-red-600 text-sm py-2.5 px-3 font-medium transition-colors"
                                onClick={handleSignOut}
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

            </div>
        </header>
    );
}