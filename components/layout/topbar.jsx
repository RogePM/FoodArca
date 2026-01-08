'use client';

import React, { useEffect, useState } from 'react';
import {
    Menu, ChevronDown, Copy, Check, MapPin,
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
    // 👇 1. ADD THIS NEW STATE to control the menu opening/closing
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    // Notification State
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

        // Load dismissed alerts from LocalStorage
        if (pantryId) {
            const savedDismissed = JSON.parse(localStorage.getItem(`dismissed-alerts-${pantryId}`) || '[]');
            setDismissedIds(savedDismissed);
        }
    }, [supabase, pantryId]);

    // --- NOTIFICATION LOGIC ---
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

                    // Filter out alerts that have been dismissed locally
                    const activeAlerts = allAlerts.filter(alert => !dismissedIds.includes(alert.id));

                    setNotifications(activeAlerts);
                    setUnreadCount(activeAlerts.length);

                    // Red Dot Logic
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

    // 👇 4. UPDATE DISMISS HANDLER to stop clicks from navigating
    const handleDismiss = (e, id) => {
        e.preventDefault(); // Prevent default link behavior
        e.stopPropagation(); // 🛑 STOP the click from triggering the row click

        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        localStorage.setItem(`dismissed-alerts-${pantryId}`, JSON.stringify(newDismissed));
    };

    // --- OPEN HANDLER ---
    const handleOpenChange = (isOpen) => {
        setIsNotifOpen(isOpen);
        if (isOpen) {
            setHasSeenAlerts(true);
            localStorage.setItem(`notif-count-${pantryId}`, unreadCount.toString());
        }
    };

    // --- NAVIGATION HANDLER (Fixed) ---
    const handleNotificationClick = (notification) => {
        // Close the menu immediately
        setIsNotifOpen(false);

        // Navigate
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
            <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl md:px-6">
                <div className="h-5 w-32 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse"></div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white/90 px-4 backdrop-blur-xl md:px-6 transition-all">

            {/* --- LEFT: Breadcrumb / Mobile Menu --- */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-gray-500 hover:bg-gray-100 rounded-xl"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <div className="hidden md:flex items-center text-sm font-medium">
                    <span className="text-gray-400">Dashboard</span>
                    <span className="mx-2 text-gray-300">/</span>
                    <span className="text-gray-900 bg-gray-100/80 px-2.5 py-1 rounded-lg border border-gray-200/50 shadow-sm">
                        {activeView}
                    </span>
                </div>

                <span className="md:hidden font-bold text-lg text-gray-900 tracking-tight">{activeView}</span>
            </div>

            {/* --- RIGHT: Controls --- */}
            <div className="flex items-center gap-2 md:gap-3">

                {/* 1. ORGANIZATION SWITCHER (Desktop Only) */}
                <div className="hidden md:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 py-1.5 px-2 pl-2 pr-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all outline-none group shadow-sm active:scale-95 duration-200">
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-[#d97757] border border-orange-100">
                                    {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Building2 className="h-3 w-3" />}
                                </div>
                                <span className="text-xs font-semibold text-gray-700 max-w-[100px] truncate">
                                    {isLoading ? 'Loading...' : (pantryDetails?.name || 'Select')}
                                </span>
                                <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border-gray-100 bg-white/95 backdrop-blur-sm mt-2">

                            {/* CURRENT PANTRY CARD - WRAPPED IN ITEM TO CLOSE MENU ON CLICK */}
                            <DropdownMenuItem
                                className="p-0 focus:bg-transparent outline-none mb-2"
                                onClick={() => setActiveView('Settings')}
                            >
                                <div className="w-full bg-gray-50/80 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-orange-50/50 transition-colors group/card">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900 leading-none mb-1 group-hover/card:text-[#d97757] transition-colors">
                                                {pantryDetails?.name}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <MapPin className="h-3 w-3" />
                                                {pantryDetails?.address || 'No location set'}
                                            </div>
                                        </div>
                                        {/* Copy Code Button */}
                                        {pantryDetails?.join_code && (
                                            <button
                                                onClick={handleCopyCode}
                                                className="group/code flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 hover:border-[#d97757]/30 transition-colors shadow-sm"
                                            >
                                                <code className="text-[10px] font-mono font-bold text-gray-600 group-hover/code:text-[#d97757]">
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
                                        <DropdownMenuItem
                                            key={membership.pantry_id}
                                            onClick={() => switchPantry(membership.pantry_id)}
                                            className={`cursor-pointer rounded-lg py-2 px-2 flex items-center justify-between transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${isSelected ? 'bg-white border-orange-100 text-[#d97757]' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* 2. PREMIUM NOTIFICATIONS BELL */}
                <DropdownMenu open={isNotifOpen} onOpenChange={handleOpenChange}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full h-10 w-10 transition-transform active:scale-95">
                            <Bell className="h-5 w-5" strokeWidth={2} />
                            {unreadCount > 0 && !hasSeenAlerts && (
                                <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white shadow-sm animate-pulse" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-80 rounded-2xl shadow-2xl border-gray-100 p-0 mt-2 overflow-hidden ring-1 ring-black/5">
                        {/* Header */}
                        <div className="bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-900">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="h-5 min-w-[20px] flex items-center justify-center text-[10px] bg-[#d97757] text-white px-1.5 rounded-full font-bold shadow-sm shadow-orange-200">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* List with Animations */}
                        <div className="max-h-[350px] overflow-y-auto bg-gray-50/50 min-h-[150px]">
                            <AnimatePresence>
                                {notifications.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center p-8 text-center"
                                    >
                                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border border-gray-100">
                                            <Sparkles className="h-6 w-6 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">All caught up!</p>
                                        <p className="text-xs text-gray-400 mt-1">No new alerts for your pantry.</p>
                                    </motion.div>
                                ) : (
                                    notifications.map((note) => {
                                        const Icon = getAlertIcon(note.type, note.id);
                                        const isCritical = note.type === 'critical';

                                        return (
                                            <DropdownMenuItem
                                                key={note.id}
                                                // ✨ Pass the full object so handleNotificationClick can read 'targetView'
                                                onClick={() => handleNotificationClick(note)}
                                                className="p-0 focus:bg-transparent cursor-pointer relative"
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="w-full p-4 border-b border-gray-100 hover:bg-white transition-colors flex justify-between items-start group pr-8"
                                                >
                                                    <div className="flex gap-3 items-start">
                                                        <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border 
                              ${isCritical ? 'bg-red-50 border-red-100 text-red-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 group-hover:text-[#d97757] transition-colors line-clamp-1">{note.title}</p>
                                                            <p className="text-xs text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{note.message}</p>
                                                            <p className="text-[10px] text-gray-400 mt-2 font-medium">Just now</p>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* X Button - Positioned Absolute */}
                                                <button
                                                    onClick={(e) => handleDismiss(e, note.id)}
                                                    className="absolute top-3 right-3 z-50 p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <XIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </DropdownMenuItem>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </div>

                        {/* --- PERMANENT FOOTER --- */}
                        <div className="p-2 border-t border-gray-100 bg-white">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-10 rounded-xl flex items-center justify-between px-4 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                                // ✨ Manually construct the object to force the Settings view
                                onClick={() => handleNotificationClick({ targetView: 'Settings', action: 'billing' })}
                            >
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#d97757]" />
                                    <span>Billing & Usage</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-normal">
                                    Check Limits <ChevronDown className="h-3 w-3 -rotate-90" />
                                </div>
                            </Button>
                        </div>

                    </DropdownMenuContent>
                </DropdownMenu>

                {/* 3. USER PROFILE */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-0 outline-none ml-1">
                            <Avatar className="h-9 w-9 border-2 border-white shadow-md ring-1 ring-gray-100 transition-transform hover:scale-105">
                                <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                                <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white font-bold text-xs">
                                    {getInitials(userData.name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-gray-100 p-1 mt-2">
                        <div className="px-3 py-3 bg-gray-50/50 rounded-xl mb-1 border border-gray-100/50">
                            <p className="text-sm font-bold text-gray-900">{userData.name}</p>
                            <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                        </div>

                        {/* --- MOBILE ONLY: Organization Info inside Profile --- */}
                        <div className="md:hidden border-b border-gray-100 mb-1 pb-1">
                            <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2">
                                Current Pantry
                            </DropdownMenuLabel>
                            <div className="px-2 py-2">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#d97757]">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{pantryDetails?.name}</p>
                                        <p className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-0.5">{pantryDetails?.join_code}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg focus:bg-red-50 text-red-600 text-sm py-2.5 px-3 font-medium transition-colors mt-1"
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